import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser } from "@/lib/middleware";

const XSD_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="transactions">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="transaction" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="date" type="xs:date"/>
              <xs:element name="recipient" type="xs:string"/>
              <xs:element name="amount" type="xs:decimal"/>
              <xs:element name="description" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.setHeader("Content-Type", "application/xml");
  return res.status(200).send(XSD_CONTENT);
}
