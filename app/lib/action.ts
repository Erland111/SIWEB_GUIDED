'use server';


import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';


// SQL Connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


// --- Schema ---
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});


export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}


const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });


// --- Create Invoice ---
export async function createInvoice(formData: FormData) {
  const parsedData = CreateInvoiceSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });


  const amountInCents = parsedData.amount * 100;
  const date = new Date().toISOString().split('T')[0];


  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${parsedData.customerId}, ${amountInCents}, ${parsedData.status}, ${date})
  `;


  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


// --- Update Invoice ---
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoiceSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });


  const amountInCents = amount * 100;


  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;


  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}





