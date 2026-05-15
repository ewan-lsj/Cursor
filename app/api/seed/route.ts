import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PHASES, ITEMS } from "@/lib/seed-data";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: existingPhases } = await supabase
    .from("learning_phases")
    .select("id")
    .limit(1);

  if (existingPhases && existingPhases.length > 0) {
    return NextResponse.json({ message: "Already seeded" });
  }

  for (const phase of PHASES) {
    const { data: phaseData, error: phaseError } = await supabase
      .from("learning_phases")
      .insert(phase)
      .select()
      .single();

    if (phaseError || !phaseData) {
      return NextResponse.json(
        { error: `Failed to insert phase: ${phaseError?.message}` },
        { status: 500 }
      );
    }

    const phaseItems = ITEMS[phase.phase_number] || [];
    const itemRows = phaseItems.map((title, idx) => ({
      phase_id: phaseData.id,
      title,
      description: "",
      sort_order: idx,
      completed: false,
      notes: "",
    }));

    if (itemRows.length > 0) {
      const { error: itemsError } = await supabase
        .from("learning_items")
        .insert(itemRows);

      if (itemsError) {
        return NextResponse.json(
          { error: `Failed to insert items: ${itemsError.message}` },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ message: "Seeded successfully" });
}
