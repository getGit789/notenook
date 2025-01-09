import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SiGithub } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";

type FormData = {
  email: string;
  password: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { login, register } = useUser();

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = isLogin 
        ? await login(data)
        : await register(data);

      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Registered successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">NoteNook</h1>
        <p className="text-muted-foreground">Your Personal Note-Taking Sanctuary</p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Login" : "Register"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/auth/google"}
                className="w-full h-10 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 shadow-sm"
              >
                <FcGoogle className="h-5 w-5" />
                <span className="text-gray-800 font-medium">Sign in with Google</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/auth/github"}
                className="w-full h-10 flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white border-[#1b1f23]"
              >
                <SiGithub className="h-5 w-5" />
                <span className="font-medium">Sign in with GitHub</span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {isLogin ? "Login" : "Register"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Need an account? Register" : "Have an account? Login"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}