import {
  MissingApiKeyError,
  MissingAuthHeaderError,
  MissingApiUrlError,
  HttpResponseError,
} from "@/utils/errors/apiErrors";
import { NextApiResponse } from "next";

export function handleApiError(error: unknown, res: NextApiResponse) {
  if (
    error instanceof MissingApiKeyError ||
    error instanceof MissingAuthHeaderError ||
    error instanceof MissingApiUrlError
  ) {
    // Configuration errors indicate server-side misconfiguration
    res
      .status(500)
      .json({ error: "Server configuration error: " + error.message });
  } else if (error instanceof HttpResponseError) {
    // HttpResponseError includes status from external APIs
    res.status(error.statusCode).json({ error: error.message });
  } else if (error instanceof Error) {
    // Generic error handling for any other Error instances
    res.status(500).json({ error: error.message });
  } else {
    // Fallback for when error type is unknown
    res.status(500).json({ error: "An unknown error occurred" });
  }
}
