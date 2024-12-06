import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
 
export function middleware(request: NextRequest) {
  // אם המשתמש מגיע לנתיב הראשי, הפנה אותו לדף הבית
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}