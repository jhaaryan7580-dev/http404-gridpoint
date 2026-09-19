import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";

export default function App() {
  return <ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster richColors position="bottom-right" /><Home /></TooltipProvider></ThemeProvider>;
}
