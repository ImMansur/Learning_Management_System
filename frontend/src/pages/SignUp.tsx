import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { isFirebaseAuthConfigured } from "@/services/firebaseAuthService";
import { useUser } from "@/context/UserContext";

const SignUp = () => {
	const navigate = useNavigate();
	const { user, signup, isLoading } = useUser();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState<"Learner" | "Trainer">("Learner");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!user) return;

		if (user.role === "Trainer") {
			navigate("/trainer/courses", { replace: true });
			return;
		}

		if (user.role === "Admin") {
			navigate("/admin", { replace: true });
			return;
		}

		navigate("/dashboard", { replace: true });
	}, [navigate, user]);

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading) return;

		if (password !== confirmPassword) {
			toast({ title: "Sign up failed", description: "Passwords do not match", variant: "destructive" });
			return;
		}

		if (password.length < 6) {
			toast({ title: "Sign up failed", description: "Password should be at least 6 characters", variant: "destructive" });
			return;
		}

		setLoading(true);
		try {
			const authenticatedUser = await signup(name.trim(), email.trim().toLowerCase(), password, role);
			const trainerRequested = role === "Trainer";
			const trainerAssigned = authenticatedUser.role === "Trainer";

			toast({
				title: "Account created",
				description:
					trainerRequested && !trainerAssigned
						? "Account created, but trainer role is pending Firestore permissions."
						: `Welcome, ${authenticatedUser.name}`,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unable to create account";
			toast({ title: "Sign up failed", description: message, variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left panel – branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
				{/* Decorative blurred circles */}
				<div className="absolute inset-0 opacity-10">
					<div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary-foreground blur-3xl" />
					<div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
				</div>

				{/* Top logo */}
				<div className="relative z-10">
					<div className="flex items-center gap-3 mb-2">
						<div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
							<Sparkles className="w-5 h-5 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold text-primary-foreground">LTC Learn</span>
					</div>
				</div>

				{/* Hero text */}
				<div className="relative z-10 space-y-6">
					<h1 className="text-4xl xl:text-5xl font-extrabold text-primary-foreground leading-tight">
						Start your
						<br />
						<span className="text-accent">Learning Journey</span>
					</h1>
					<p className="text-primary-foreground/80 text-lg max-w-md">
						Create an account and get access to AI-powered courses, personalised progress tracking, and more.
					</p>
					<div className="flex gap-4 pt-4">
						{["AI Summaries", "Video Lessons", "Quizzes", "Progress"].map((tag) => (
							<span
								key={tag}
								className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20"
							>
								{tag}
							</span>
						))}
					</div>
				</div>

				{/* Bottom note */}
				<div className="relative z-10 flex items-center gap-2 text-primary-foreground/60 text-sm">
					<Shield className="w-4 h-4" />
					<span>Secure & Private</span>
				</div>
			</div>

			{/* Right panel – sign-up form */}
			<div className="flex-1 flex items-center justify-center p-8 bg-background">
				<div className="w-full max-w-md space-y-8">
					{/* Mobile-only logo */}
					<div className="lg:hidden flex items-center gap-3 mb-8">
						<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
							<Sparkles className="w-5 h-5 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold text-foreground">LTC Learn</span>
					</div>

					<div>
						<h2 className="text-3xl font-bold text-foreground">Create Account</h2>
						<p className="text-muted-foreground mt-2">Register as Learner or Trainer</p>
					</div>

					{!isFirebaseAuthConfigured() && (
						<p className="text-xs text-destructive">
							Firebase is not configured. Add VITE_FIREBASE_API_KEY to your .env file.
						</p>
					)}

					<form onSubmit={handleSignUp} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="Your name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-12 rounded-xl bg-secondary border-none text-foreground placeholder:text-muted-foreground"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email" className="text-foreground font-medium">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@ltclearn.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-12 rounded-xl bg-secondary border-none text-foreground placeholder:text-muted-foreground"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="role" className="text-foreground font-medium">Role</Label>
							<select
								id="role"
								value={role}
								onChange={(e) => setRole(e.target.value as "Learner" | "Trainer")}
								className="flex h-12 w-full rounded-xl bg-secondary border-none px-3 py-2 text-sm text-foreground"
							>
								<option value="Learner">Learner</option>
								<option value="Trainer">Trainer</option>
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-foreground font-medium">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="h-12 rounded-xl bg-secondary border-none text-foreground placeholder:text-muted-foreground pr-10"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="h-12 rounded-xl bg-secondary border-none text-foreground placeholder:text-muted-foreground pr-10"
									required
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								>
									{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							disabled={loading || isLoading || !isFirebaseAuthConfigured()}
							className="w-full h-12 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
						>
							{loading ? (
								<span className="animate-pulse">Creating account…</span>
							) : (
								<>
									Sign Up
									<ArrowRight className="w-4 h-4 ml-1" />
								</>
							)}
						</Button>
					</form>

					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link to="/" className="text-primary font-semibold hover:underline">
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignUp;
