import { makeMIRequest, miRequestSchema } from "@/app/lib/clients/mi";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const paramsSchema = z.discriminatedUnion("state", [miRequestSchema], {
  message: "Please provide a supported state.",
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const searchParms = request.nextUrl.searchParams.keys().reduce(
    (acc, key) => {
      const val = request.nextUrl.searchParams.get(key);
      if (val) {
        acc[key] = val;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const validInput = paramsSchema.safeParse({
    ...(await params),
    ...searchParms,
  });

  if (!validInput.success) {
    return NextResponse.json(
      {
        message: validInput.error.issues[0].message,
      },
      { status: 400 },
    );
  }

  switch (validInput.data.state) {
    case "MI": {
      try {
        const response = await makeMIRequest({
          dba: validInput.data.dba,
          city: validInput.data.city,
        });

        if (!response.success) {
          return NextResponse.json({
            validated: false,
          });
        }

        if (!(response.result.data.length > 0)) {
          return NextResponse.json({
            validated: false,
          });
        }

        return NextResponse.json({
          validated: true,
        });
      } catch {
        return NextResponse.json(
          {
            message: "Internal Server Error",
          },
          { status: 500 },
        );
      }
    }
    default: {
      return NextResponse.json(
        {
          message: `${validInput.data.state} is not yet supported.`,
        },
        { status: 400 },
      );
    }
  }
}
