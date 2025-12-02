import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [responseMessage, setResponseMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleSubmit = async () => {
        try {
            const res = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setResponseMessage(data.message || "Invalid credentials");
                setIsError(true);
            } else {
                setResponseMessage(data.message || "Login successful");
                setIsError(false);
            }
        } catch (err) {
            console.error(err);
            setResponseMessage("Error connecting to backend");
            setIsError(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-center">Shadcn UI Test</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            placeholder="test@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {responseMessage && (
                        <p className={`text-center mt-2 ${isError ? "text-red-600" : "text-green-600"}`}>
                            {responseMessage}
                        </p>
                    )}
                </CardContent>

                <CardFooter>
                    <Button className="w-full" onClick={handleSubmit}>
                        Submit
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default App;