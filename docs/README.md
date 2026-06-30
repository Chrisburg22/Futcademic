# Futcamedic Documentation

Profesional documentation for Futcamedic — Multi-Tenant Football Academy Management System.

## Directory Structure

```
docs/
├── README.md                          # This file
├── product/                           # Product documentation (English & Spanish)
│   ├── PRODUCT-DEFINITION.md         # Product Definition (English)
│   ├── PRD-MAIN.md                   # PRD (English)
│   ├── DEFINICION-PRODUCTO.md        # Definición del Producto (Español)
│   ├── PRD-PRINCIPAL.md              # PRD Principal (Español)
├── technical/                         # Technical documentation (English & Spanish)
│   ├── API-REFERENCE.md              # API Reference (English)
│   ├── DATABASE-SCHEMA.md            # Database Schema (English)
│   ├── REFERENCIA-API.md             # Referencia de API (Español)
│   ├── ESQUEMA-BASE-DATOS.md         # Esquema de Base de Datos (Español)
├── scrum/                            # Scrum/Agile artifacts
│   └── user-stories.csv              # User stories in CSV format for scrum-master-agent
└── pdfs/                             # Generated PDFs (to be generated)
```

## Files Description

### Product Documentation

#### English
- **PRODUCT-DEFINITION.md**: Product definition following product-owner skill. Defines what Futcamedic is, the buyer persona, Day-1 experience, and evidence status.
- **PRD-MAIN.md**: Complete Product Requirements Document with problem statement, success criteria, customer stories, scope, acceptance criteria, dependencies, and open questions.

#### Español
- **DEFINICION-PRODUCTO.md**: Definición del producto siguiendo la skill product-owner. Define qué es Futcamedic, buyer persona, experiencia Día-1 y estado de evidencia.
- **PRD-PRINCIPAL.md**: Documento de Requisitos del Producto completo con declaración del problema, criterios de éxito, historias de usuario, alcance, criterios de aceptación, dependencias y preguntas abiertas.

### Technical Documentation

#### English
- **API-REFERENCE.md**: Complete REST API documentation with all endpoints, request/response examples, query parameters, and error handling.
- **DATABASE-SCHEMA.md**: PostgreSQL database schema documentation with all 14 tables, columns, constraints, relationships, and RLS policies.

#### Español
- **REFERENCIA-API.md**: Documentación completa de la API REST con todos los endpoints, ejemplos de solicitud/respuesta, parámetros de consulta y manejo de errores.
- **ESQUEMA-BASE-DATOS.md**: Documentación del esquema de base de datos PostgreSQL con todas las 14 tablas, columnas, restricciones, relaciones y políticas RLS.

### Scrum/Agile Artifacts
- **user-stories.csv**: 60+ user stories in CSV format compatible with scrum-master-agent. Includes story ID, title, points, status, assignee, priority, role, and description.

## Tools & Skills Used

This documentation was generated using:
- **product-owner** skill: For product definition and PRD structure
- **scrum-master-agent** skill: For user stories in CSV format (compatible with Linear, Jira, GitHub Projects, Azure DevOps)
- **whitepaper** skill: For professional PDF generation (pandoc + typst)

## How to Use

### For Product Managers
1. Start with `PRODUCT-DEFINITION.md` (or `DEFINICION-PRODUCTO.md` for Spanish)
2. Review `PRD-MAIN.md` for complete requirements
3. Use `user-stories.csv` with scrum-master-agent for sprint planning

### For Developers
1. Read `API-REFERENCE.md` for endpoint documentation
2. Review `DATABASE-SCHEMA.md` for table structures and relationships
3. Check `user-stories.csv` for implementation tasks

### For Scrum Masters
1. Import `user-stories.csv` into your tool (Linear, Jira, GitHub Projects, Azure DevOps)
2. Run scrum-master-agent for sprint planning, velocity tracking, and burndown analysis
3. Use the PRD for acceptance criteria

## Generating PDFs

To generate professional PDFs from the Markdown files:

```bash
# Install dependencies (if not installed)
brew install pandoc typst

# Generate PDFs (English)
cd docs/product
pandoc PRODUCT-DEFINITION.md -o PRODUCT-DEFINITION.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4
pandoc PRD-MAIN.md -o PRD-MAIN.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4

# Generate PDFs (Spanish)
pandoc DEFINICION-PRODUCTO.md -o DEFINICION-PRODUCTO.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4
pandoc PRD-PRINCIPAL.md -o PRD-PRINCIPAL.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4

# Technical docs
cd ../technical
pandoc API-REFERENCE.md -o API-REFERENCE.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4
pandoc DATABASE-SCHEMA.md -o DATABASE-SCHEMA.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4
pandoc REFERENCIA-API.md -o REFERENCIA-API.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4
pandoc ESQUEMA-BASE-DATOS.md -o ESQUEMA-BASE-DATOS.pdf --pdf-engine=typst -V mainfont="Helvetica" -V fontsize=10pt -V papersize=a4
```

## Contact

For questions about this documentation, contact the Futcamedic team.

---

**Generated**: May 5, 2026  
**Version**: 1.0.0  
**Skills Used**: product-owner, scrum-master-agent, whitepaper
