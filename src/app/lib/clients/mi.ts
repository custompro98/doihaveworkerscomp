import axios from "axios";
import { z } from "zod";

export const miRequestSchema = z.object({
  state: z.literal("MI"),
  dba: z.string({ message: "Please provide a valid DBA." }),
  city: z.string({ message: "Please provide a valid city." }),
});

const responseSchema = z.object({
  success: z.boolean(),
  result: z.object({
    data: z.array(
      z.object({
        employerId: z.number(),
        employerName: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        overallCount: z.number(),
      }),
    ),
    totalRecords: z.number(),
    currentPage: z.number(),
  }),
  errors: z.array(z.string()),
  errorsHtml: z.string(),
});

export type MIResponse = z.infer<typeof responseSchema>;

interface Params {
  dba: string;
  city: string;
}

export async function makeMIRequest({
  dba,
  city,
}: Params): Promise<MIResponse> {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const year = today.getFullYear();
  const formattedDate = `${month}/${day}/${year}`;

  try {
    const response = await axios.post<MIResponse>(
      "https://app.leo.state.mi.us/WORCS/api/Entities/InsuranceCoverage/GetInsuranceCoverage",
      {
        selectItemsPerPage: [10, 15, 20, 50, 100],
        pageSize: 15,
        pageIndex: 0,
        totalRecords: 0,
        filter: `[{"dataIndx":"EmployerName","condition":"Exact Match","value":"${dba.toLowerCase()}"},{"dataIndx":"City","condition":null,"value":"${city.toLowerCase()}"},{"dataIndx":"InjuryDate","condition":null,"value":"${formattedDate}"}]`,
        sort: '[{"dataIndx":"EmployerName","dir":""}]',
        mode: "OR",
        data: [],
      },
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9,la;q=0.8",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (e) {
    console.error("Failed to make API call for MI", e);

    throw e;
  }
}
