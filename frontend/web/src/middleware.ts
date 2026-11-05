import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/aluno", "/professor", "/admin", "/monitor"];

const roleMap = {
  aluno: ["/aluno"],
  professor: ["/professor"],
  funcionario: ["/professor"],
  admin: ["/admin"],
  monitor: ["/monitor"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/cadastro" || pathname === "/") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("lab_session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const roleName = decodeURIComponent(sessionCookie);
  if (!(roleName in roleMap)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("lab_session");
    return response;
  }

  let allowedRoutes;

  if (roleName === "admin") {
    allowedRoutes = Object.keys(roleMap);
  } else {
    allowedRoutes = roleMap[roleName as keyof typeof roleMap] ?? [];
  }

  const isProtected = protectedRoutes.some((prefix) => {
    return pathname.startsWith(prefix);
  });

  if (!isProtected) {
    return NextResponse.next();
  }

  const isAuthorized = allowedRoutes.some((prefix) => {
    return pathname.startsWith(prefix);
  });

  if (!isAuthorized) {
    return NextResponse.redirect(new URL("/acesso-negado", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
