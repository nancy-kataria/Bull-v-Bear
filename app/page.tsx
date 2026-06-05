"use client";

import { useState } from "react";
import { Nav } from "@/components/landing-page/Nav";
import { Hero } from "@/components/landing-page/Hero";
import { TickerTape } from "@/components/landing-page/TickerTape";
import { HowItWorks } from "@/components/landing-page/HowItWorks";
import { Manifesto } from "@/components/landing-page/Manifesto";
import { Footer } from "@/components/Footer";
import { SignInModal } from "@/components/SignInModal";
import { SignUpModal } from "@/components/SignUpModal";

export default function Index() {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav setShowSignInModal={setShowSignInModal} setShowSignUpModal={setShowSignUpModal} />
      <Hero />
      <TickerTape />
      <HowItWorks />
      <Manifesto setShowSignUpModal={setShowSignUpModal} />
      <Footer />
      <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />
      <SignUpModal isOpen={showSignUpModal} onClose={() => setShowSignUpModal(false)} />
    </div>
  );
}
