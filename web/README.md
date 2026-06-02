# SOLFIN Perú — Frontend

Sitio web institucional de SOLFIN Perú construido con **React + TypeScript** siguiendo **Arquitectura Hexagonal (Ports & Adapters)**.

## 🚀 Instalación y ejecución

```bash
npm install
npm start       # desarrollo en http://localhost:3000
npm run build   # build de producción
```

---

## 🏗️ Arquitectura Hexagonal

```
src/
├── domain/                         ← NÚCLEO (sin dependencias externas)
│   ├── entities/                   ← Entidades del dominio
│   │   ├── CreditService.ts        ← Tipos de crédito
│   │   ├── ContactInfo.ts          ← Info de contacto
│   │   └── CompanyInfo.ts          ← Info de la empresa
│   └── ports/
│       ├── input/                  ← Puertos de entrada (driving)
│       │   ├── ICreditServiceUseCase.ts
│       │   ├── IContactUseCase.ts
│       │   └── ICompanyInfoUseCase.ts
│       └── output/                 ← Puertos de salida (driven)
│           ├── ICreditServiceRepository.ts
│           ├── IContactRepository.ts
│           └── ICompanyRepository.ts
│
├── application/                    ← CASOS DE USO
│   └── usecases/
│       ├── GetCreditServicesUseCase.ts
│       ├── GetContactInfoUseCase.ts
│       └── GetCompanyInfoUseCase.ts
│
├── infrastructure/                 ← ADAPTADORES EXTERNOS
│   ├── repositories/               ← Driven adapters (implementan output ports)
│   │   ├── StaticCreditServiceRepository.ts
│   │   ├── StaticContactRepository.ts
│   │   └── StaticCompanyRepository.ts
│   └── config/
│       └── container.ts            ← Inyección de dependencias
│
└── ui/                             ← ADAPTADORES DE INTERFAZ
    ├── styles/
    │   ├── theme.ts                ← Design tokens
    │   └── global.css
    ├── hooks/                      ← Driving adapters (conectan UI con use cases)
    │   ├── useCreditServices.ts
    │   ├── useContact.ts
    │   ├── useInView.ts
    │   └── useScrolled.ts
    └── components/
        ├── layout/                 ← Navbar, Footer, FloatingWhatsApp
        ├── sections/               ← Hero, Services, WhyUs, HowItWorks, Contact, CTA
        └── common/                 ← AnimatedSection, SectionHeader, WhatsAppIcon
```

## 🔄 Flujo de la Arquitectura

```
UI (React) → hooks (driving adapters) → UseCases (application)
                                              ↓
                                        Repositories (driven adapters)
                                              ↓
                                        Static Data / API (infrastructure)
```

## 🔧 Reemplazar datos estáticos por API

Para conectar una API real, solo necesitas:
1. Crear un nuevo adaptador en `src/infrastructure/repositories/`, p.ej. `ApiCreditServiceRepository.ts`
2. Implementar el interface de output port correspondiente
3. Actualizar `src/infrastructure/config/container.ts` para usar el nuevo adaptador

**El dominio y la aplicación no cambian.**

## 🎨 Colores
| Token   | Hex       | Uso         |
|---------|-----------|-------------|
| blue    | `#1b4ea1` | Principal   |
| red     | `#ed1c24` | Secundario  |
| yellow  | `#fcf12e` | Acento      |

## 📞 Contacto
WhatsApp: +51 986 366 302
