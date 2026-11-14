/**
 * Store copy that isn't stored in the backend: help answers, contact details and
 * delivery notes. Edit these to match how your shop actually works.
 */
export const SUPPORT = {
  email: 'support@voltix.lk',      // TODO: your real support address
  phone: '+94 11 000 0000',        // TODO: your real number
  hours: 'Monday to Saturday, 9.00 A.M to 21.00 P.M',
};

export const DELIVERY_NOTES = [
  { title: 'Delivery', text: 'We deliver to the address saved on your profile. You can change it at checkout.' },
  { title: 'Order receipts', text: 'Every order gets a receipt with its number. Keep it handy if you contact support.' },
  { title: 'Returns', text: 'Unopened items can be returned within 7 days. Contact support with your order number to start.' },
];

export const FAQ = [
  {
    group: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Add products to your cart, open the cart, then choose Go to checkout. Check your delivery address and place the order. You get a receipt straight away.' },
      { q: 'Where can I see my orders?', a: 'Open Orders from the menu. Receipts are kept in the browser you ordered from, so sign in on the same device to see them.' },
      { q: 'Can I change an order after placing it?', a: 'Contact support with your order number as soon as possible and we will help before it ships.' },
    ],
  },
  {
    group: 'Products',
    items: [
      { q: 'How does Compare work?', a: 'Select Compare on up to three products. A tray appears at the bottom of the screen; open it to see prices and specs side by side.' },
      { q: 'What does "Only 3 left" mean?', a: 'That is the number we have in stock right now. Your cart can hold up to that many.' },
      { q: 'Are the specs exact?', a: 'Specs come from the manufacturer. Regional versions can differ slightly, so check the model code if one detail matters to you.' },
    ],
  },
  {
    group: 'Account',
    items: [
      { q: 'Why was I signed out?', a: 'For security, sessions end after 30 minutes. Sign in again and your cart will still be there.' },
      { q: 'How do I change my delivery address?', a: 'Open Profile and address from the account menu, or change it at checkout.' },
    ],
  },
];
