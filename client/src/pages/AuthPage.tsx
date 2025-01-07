import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Separator } from "@/components/ui/separator";

type FormData = {
  username: string;
  password: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { login, register } = useUser();

  const form = useForm<FormData>({
    defaultValues: {
      username: "",
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
                onClick={() => window.location.href = "/api/auth/google"}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <g fill="none" fillRule="evenodd">
                    <path d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.7 2.6v2.2h2.8c1.6-1.5 2.7-3.8 2.7-6.4z" fill="#4285F4"/>
                    <path d="M9 18c2.3 0 4.3-.8 5.7-2.1l-2.8-2.2c-.8.5-1.8.9-2.9.9-2.2 0-4.1-1.5-4.8-3.5H1.4v2.3C2.8 15.9 5.7 18 9 18z" fill="#34A853"/>
                    <path d="M4.2 11.1c-.2-.5-.3-1-.3-1.6 0-.6.1-1.1.3-1.6V5.6H1.4C.5 7 0 8.4 0 10c0 1.6.5 3 1.4 4.4l2.8-3.3z" fill="#FBBC05"/>
                    <path d="M9 3.9c1.2 0 2.3.4 3.2 1.3L14.9 2.5C13.5 1 11.4 0 9 0 5.7 0 2.8 2.1 1.4 4.6l2.8 2.3C4.9 5.4 6.8 3.9 9 3.9z" fill="#EA4335"/>
                  </g>
                </svg>
                <span className="ml-2 font-medium">Continue with Google</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/api/auth/github"}
                className="w-full flex items-center justify-center gap-2"
              >
                <SiGithub className="h-4 w-4" />
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
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