-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('aluno', 'professor', 'funcionario', 'admin', 'monitor');

-- CreateEnum
CREATE TYPE "LaboratorioTipo" AS ENUM ('redes', 'informatica');

-- CreateEnum
CREATE TYPE "Periodo" AS ENUM ('manha', 'tarde', 'noite');

-- CreateEnum
CREATE TYPE "AgendamentoStatus" AS ENUM ('pendente', 'aprovado', 'recusado', 'cancelado', 'aguardando_confirmacao_cancelamento');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'aluno',
ALTER COLUMN "ra" DROP NOT NULL;

-- CreateTable
CREATE TABLE "laboratorios" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "tipo" "LaboratorioTipo" NOT NULL DEFAULT 'redes',
    "capacidade" INTEGER NOT NULL DEFAULT 1,
    "horariosFixos" JSONB,

    CONSTRAINT "laboratorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "computadorId" TEXT,
    "data" TEXT NOT NULL,
    "periodo" "Periodo" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "finalidade" VARCHAR(500) NOT NULL,
    "precisaMonitor" BOOLEAN NOT NULL DEFAULT false,
    "foraDoExpediente" BOOLEAN NOT NULL DEFAULT false,
    "ehEad" BOOLEAN NOT NULL DEFAULT false,
    "status" "AgendamentoStatus" NOT NULL DEFAULT 'pendente',
    "aprovadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
