import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type User } from "@shared/routes";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const walletAddress = accounts[0];
      const signer = await provider.getSigner();

      // 1. Get Nonce
      const nonceRes = await fetch(api.auth.getNonce.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      // 2. Sign Message
      const signature = await signer.signMessage(nonce);

      // 3. Verify Signature
      const verifyRes = await fetch(api.auth.verify.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature }),
      });
      
      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.message || "Login failed");
      }

      return api.auth.verify.responses[200].parse(await verifyRes.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({ title: "Welcome back!", description: "Wallet connected successfully." });
      
      // Redirect based on profile completion
      if (!data.user.name || !data.user.age) {
        setLocation("/onboarding");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Connection Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      setLocation("/");
      toast({ title: "Logged out" });
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await fetch(api.users.updateProfile.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return api.users.updateProfile.responses[200].parse(await res.json());
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData([api.auth.me.path], updatedUser);
      toast({ title: "Profile updated", description: "Your health profile is up to date." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    }
  });
}
