import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Supabase auth check timed out"));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/*
 * Checks whether a thrown value is Supabase's "refresh token is
 * invalid/missing" auth error.
 *
 * The caught value is `unknown`, so we narrow it safely instead of
 * using `any`. Supabase auth errors expose `code` and `message`
 * fields, so we read those defensively.
 */
function isInvalidRefreshTokenError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  const { code, message } = err as {
    code?: unknown;
    message?: unknown;
  };

  return (
    code === "refresh_token_not_found" ||
    (typeof message === "string" &&
      message.includes("Refresh Token Not Found"))
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  function withCookies(target: NextResponse) {
    response.cookies.getAll().forEach((cookie) => {
      target.cookies.set(cookie);
    });

    return target;
  }

  /*
   * Wipes every Supabase auth cookie from the browser.
   * Needed when the refresh token itself is invalid/gone
   * (e.g. the underlying auth user was deleted) — in that
   * case supabase.auth.signOut() can't help because there's
   * no valid session to sign out of, so we clear the cookies
   * directly to stop the stale token from being resent.
   */
  function clearAuthCookies(target: NextResponse) {
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        target.cookies.set(cookie.name, "", {
          path: "/",
          maxAge: 0,
        });
      }
    });

    return target;
  }

  const path = request.nextUrl.pathname;

  const onAuthPage =
    path === "/login" ||
    path === "/register";

  const onDashboard =
    path.startsWith("/dashboard");

  /* ============================================
     GET CURRENT USER
     ============================================ */

  let user = null;
  let hadInvalidRefreshToken = false;

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      5000
    );

    if (error) {
      throw error;
    }

    user = data.user;
  } catch (err: unknown) {
    if (isInvalidRefreshTokenError(err)) {
      hadInvalidRefreshToken = true;
    } else {
      console.error(
        "Proxy: Supabase getUser() failed or timed out:",
        err
      );
    }

    user = null;
  }

  /* ============================================
     NOT LOGGED IN
     ============================================ */

  if (!user) {
    // Dashboard requires authentication
    if (onDashboard) {
      const redirect = NextResponse.redirect(
        new URL("/login", request.url)
      );

      return hadInvalidRefreshToken
        ? clearAuthCookies(redirect)
        : withCookies(redirect);
    }

    // Login/Register are public
    return hadInvalidRefreshToken
      ? clearAuthCookies(response)
      : response;
  }

  /* ============================================
     CHECK ADMIN
     ============================================ */

  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

  const userEmail =
    user.email
      ?.trim()
      .toLowerCase();

  const isAdmin =
    !!adminEmail &&
    !!userEmail &&
    userEmail === adminEmail;

  /* ============================================
     ADMIN USER
     ============================================ */

  if (isAdmin) {
    if (onAuthPage) {
      return withCookies(
        NextResponse.redirect(
          new URL(
            "/dashboard/admin",
            request.url
          )
        )
      );
    }

    response.headers.set(
      "Cache-Control",
      "no-store, must-revalidate"
    );

    return response;
  }

  /* ============================================
     NOT ADMIN
     ============================================ */

  await supabase.auth.signOut();

  return withCookies(
    NextResponse.redirect(
      new URL(
        "/login?error=account_not_found",
        request.url
      )
    )
  );
}

/* ==============================================
   ROUTES PROTECTED BY PROXY
   ============================================== */

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};