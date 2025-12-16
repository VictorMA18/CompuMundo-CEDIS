# ⚙️ Backend – CompuMundo CEDIS

API REST del sistema **CompuMundo CEDIS**, encargada de la lógica de negocio, seguridad, persistencia de datos y generación de reportes del Centro de Documentación.

Desarrollado con **NestJS** siguiendo buenas prácticas de arquitectura y separación de responsabilidades.

---

## 🧩 Descripción

El backend expone una API REST segura que permite gestionar usuarios, lectores, préstamos, material bibliográfico (físico y virtual), autores, categorías y reportes, aplicando reglas de negocio estrictas definidas para el CEDIS.

La API está documentada automáticamente mediante **Swagger (OpenAPI)**.

---

## 🏗️ Arquitectura

El backend sigue el patrón: 

**Controlador – Servicio – Repositorio**

* **Controller**: Manejo de peticiones HTTP y validación de DTOs
* **Service**: Lógica de negocio y reglas del sistema
* **Repository**: Acceso a datos mediante Prisma ORM

Además, se implementan:
* Pipes globales de validación
* Interceptores
* Filtros de excepciones
* Guards de autenticación y autorización

---

## 🧱 Módulos del Sistema

El backend está organizado en los siguientes módulos:

* **AuthModule**: Autenticación JWT y control de accesos
* **UsuariosModule**: Gestión de usuarios del sistema
* **LectoresModule**: Gestión de lectores (estudiantes, docentes, administrativos)
* **CategoriasModule**: Clasificación del material bibliográfico
* **AutorModule**: Gestión de autores
* **AutorMaterialModule**: Relación autor–material
* **MaterialBibliograficoModule**: Gestión general del material
* **MaterialFisicoModule**: Gestión de ejemplares físicos
* **MaterialVirtualModule**: Gestión de material digital
* **PrestamosModule**: Gestión de préstamos y devoluciones
* **ReportesModule**: Generación de reportes en PDF y Excel
* **PrismaModule**: Acceso centralizado a la base de datos
* **CommonModule**: Utilidades compartidas (filtros, interceptores)

---

## 🗄️ Modelo de Datos

La persistencia se realiza sobre **PostgreSQL** usando **Prisma ORM**. 

### Entidades principales
* Usuarios (`TB_USUARIO`)
* Lectores (`TB_LECTOR`)
* Categorías (`TB_CATEGORIA`)
* Material Bibliográfico (`TB_MATERIAL_BIBLIOGRAFICO`)
* Material Físico (`TB_MATERIAL_FISICO`)
* Material Virtual (`TB_MATERIAL_VIRTUAL`)
* Autores (`TB_AUTOR`)
* Préstamos (`TB_PRESTAMO`)
* Detalle de Préstamos (`TB_PRESTAMO_DETALLE`)

### Tipos y Enumeraciones
* `TipoPrestamo`: `FISICO | VIRTUAL`
* `FormatoMaterial`: `FISICO | VIRTUAL | MIXTO | NINGUNO`

Se aplican:
* Relaciones 1:N y N:M
* Restricciones únicas
* Eliminación lógica (Soft Delete)
* Auditoría con fechas de creación y actualización

---

## 🔐 Seguridad

* Autenticación basada en **JWT**
* Encriptación de contraseñas con **bcrypt**
* Protección de rutas mediante **Guards**
* Control de accesos por roles (**RBAC**)
* Validación global de datos con `ValidationPipe`

---

## 📑 Documentación API (Swagger)

La API está documentada automáticamente.

📍 **Swagger UI:**

`http://localhost:3000/api/docs`

Incluye:
* Endpoints
* DTOs
* Autenticación Bearer Token
* Ejemplos de request/response

---

## 📌 Reglas de Negocio Implementadas

* Préstamos con duración máxima de 3 días hábiles
* Bloqueo de préstamos por morosidad activa
* Validación estricta de stock físico
* Control de préstamos físicos y virtuales
* Eliminación lógica para mantener historial
* Validación de DNI (8 dígitos) y correos únicos

---

## 🚀 Despliegue

El sistema se encuentra desplegado en la nube utilizando servicios modernos de hosting:

* **Backend**: Railway
* **Base de datos**: PostgreSQL (Railway)
* **Contenedores**: Nixpacks
* **Variables**: Gestionadas en entorno seguro

---

## 🎓 Contexto Académico

Este proyecto fue desarrollado con fines académicos como parte del curso:

* **Universidad**: Universidad Nacional de San Agustín (UNSA)
* **Carrera**: Ingeniería de Sistemas
* **Curso**: Construcción de Software
* **Periodo**: 2025

---

## ✍️ Autores

* Choquehuanca Zapana, Hernan Andy
* Maldonado Vilca, Victor Gonzalo
* Mamani Anahua, Victor Narciso
* Quispe Marca, Edysson Darwin

---

## 📌 Estado

✅ **Backend funcional, seguro y escalable**
