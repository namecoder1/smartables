export const mapBookingStatus = (status: string) => {
  return mappedStatus[status as keyof typeof mappedStatus]
}

const mappedStatus = {
  'pending': 'In Attesa',
  'confirmed': 'Confermato',
  'arrived': 'Arrivato',
  'completed': 'Completato',
  'cancelled': 'Annullato'
}