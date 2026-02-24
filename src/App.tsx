// src/App.tsx
// Root component – composes the UI using injected use cases from the DI container

import React from 'react';
import './ui/styles/global.css';

// Infrastructure (DI container)
import { creditServiceUseCase, contactUseCase, companyInfoUseCase } from './infrastructure/config/container';

// UI hooks (driving adapters)
import { useCreditServices } from './ui/hooks/useCreditServices';
import { useContact } from './ui/hooks/useContact';

// Layout
import { Navbar } from './ui/components/layout/Navbar';
import { Footer } from './ui/components/layout/Footer';
import { FloatingWhatsApp } from './ui/components/layout/FloatingWhatsApp';

// Sections
import { HeroSection } from './ui/components/sections/HeroSection';
import { ServicesSection } from './ui/components/sections/ServicesSection';
import { WhyUsSection } from './ui/components/sections/WhyUsSection';
import { HowItWorksSection } from './ui/components/sections/HowItWorksSection';
import { ContactSection } from './ui/components/sections/ContactSection';
import { CtaBannerSection } from './ui/components/sections/CtaBannerSection';

const App: React.FC = () => {
  const services = useCreditServices(creditServiceUseCase);
  const { contactInfo, getWhatsAppUrl } = useContact(contactUseCase);
  const company = companyInfoUseCase.getCompanyInfo();

  const whatsappUrl = getWhatsAppUrl('Hola, me interesa obtener un crédito con SOLFIN Perú');

  const scrollToServices = () => {
    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar whatsappUrl={whatsappUrl} />
      <FloatingWhatsApp url={whatsappUrl} />
      <main>
        <HeroSection company={company} whatsappUrl={whatsappUrl} onScrollToServices={scrollToServices} />
        <ServicesSection services={services} whatsappUrl={contactInfo.whatsappUrl} />
        <WhyUsSection valuePropositions={company.valuePropositions} />
        <HowItWorksSection steps={company.processSteps} whatsappUrl={whatsappUrl} />
        <ContactSection contactInfo={contactInfo} whatsappUrl={whatsappUrl} />
        <CtaBannerSection whatsappUrl={whatsappUrl} />
      </main>
      <Footer />
    </>
  );
};

export default App;
