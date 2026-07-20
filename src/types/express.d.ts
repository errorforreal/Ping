export { };
    
import type { authPayload } from "../services/auth.js"

declare global {
  namespace Express {
    interface Request {
        tenantId?: string;
        tenant?: authPayload;
        authToken?: string;
        requestId?: string;
    }
  }
}
