import { notFound } from "next/navigation";
import { getSupplier } from "@/actions/suppliers";
import PageHeader from "@/components/shared/page-header";
import SupplierForm from "@/components/suppliers/supplier-form";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Edit: ${supplier.name}`}
        description="Update supplier details"
      />
      <SupplierForm
        supplier={{
          id: supplier.id,
          name: supplier.name,
          contactName: supplier.contactName ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          city: supplier.city ?? "",
          state: supplier.state ?? "",
          zipCode: supplier.zipCode ?? "",
          website: supplier.website ?? "",
          notes: supplier.notes ?? "",
          paymentTerms: supplier.paymentTerms ?? "",
          leadTimeDays: supplier.leadTimeDays,
        }}
      />
    </div>
  );
}
