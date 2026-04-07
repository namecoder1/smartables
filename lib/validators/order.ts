import { z } from "zod";

export const CreateOrderItemSchema = z.object({
  menu_item_id: z.string().min(1, "ID articolo mancante"),
  name: z.string().min(1, "Nome articolo mancante").max(200, "Nome troppo lungo"),
  price: z.number().int("Il prezzo deve essere un intero in centesimi").nonnegative("Prezzo non valido"),
  quantity: z.number().int().min(1, "Quantità minima 1").max(100, "Quantità massima 100"),
  notes: z.string().max(500, "Note troppo lunghe").optional(),
});

export const CreateOrderSchema = z.object({
  organization_id: z.string().min(1, "ID organizzazione mancante"),
  location_id: z.string().min(1, "ID sede mancante"),
  table_id: z.string().min(1, "ID tavolo mancante"),
  guest_name: z.string().max(100, "Nome ospite troppo lungo").optional(),
  items: z
    .array(CreateOrderItemSchema)
    .min(1, "L'ordine deve contenere almeno un articolo")
    .max(50, "Troppi articoli nell'ordine"),
});

export type ValidatedCreateOrderInput = z.infer<typeof CreateOrderSchema>;
