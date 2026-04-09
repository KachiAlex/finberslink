import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const section = (body.section as string) || "summary";

    // If OPENAI_API_KEY is not set, return a canned response for POC
    if (!process.env.OPENAI_API_KEY) {
      if (section === "summary") {
        return NextResponse.json({
          section: "summary",
          draft: {
            text: "Experienced product manager with 7+ years in SaaS and marketplace businesses. Delivered cross-functional initiatives that increased ARR by 30% and improved retention by 12%.",
            bullets: [
              "Led a team of 6 product managers and designers to launch a new pricing model resulting in $1.2M ARR.",
              "Built and shipped core onboarding flows, reducing time-to-first-value by 40%.",
            ],
          },
          metadata: { promptHash: uuidv4(), demo: true },
        });
      }

      return NextResponse.json({
        section,
        draft: { text: `Demo draft for section ${section}` },
        metadata: { promptHash: uuidv4(), demo: true },
      });
    }

    // TODO: implement real provider call when OPENAI_API_KEY is configured
    return NextResponse.json({ section, draft: { text: "Real provider not yet implemented in POC." }, metadata: { promptHash: uuidv4() } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
