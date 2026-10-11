// Sample data for the prototype — not connected to any live service.
export type Person = string;


export const birthdays = [
  { name: "Arika", age: 9, daysAway: 0 },
  { name: "Aariv", age: 7, daysAway: 3 },
];

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const weekEvents: { day: number; time: string; title: string; person: Person; kind: "event" | "activity" }[] = [
  { day: 0, time: "08:15", title: "School drop-off", person: "Mum", kind: "activity" },
  { day: 0, time: "17:00", title: "Cricket club", person: "Aariv", kind: "activity" },
  { day: 1, time: "15:30", title: "Swimming", person: "Arika", kind: "activity" },
  { day: 2, time: "19:00", title: "Parents' evening", person: "Da", kind: "event" },
  { day: 3, time: "18:00", title: "Piano lesson", person: "Aariv", kind: "activity" },
  { day: 4, time: "19:00", title: "Family film night", person: "Family", kind: "event" },
  { day: 5, time: "10:00", title: "Arika's birthday party", person: "Arika", kind: "event" },
  { day: 5, time: "16:00", title: "Navratri garba", person: "Family", kind: "event" },
  { day: 6, time: "11:00", title: "Temple visit", person: "Family", kind: "event" },
  { day: 6, time: "15:00", title: "Grocery run", person: "Da", kind: "activity" },
];

export const initialChores: { id: string; person: Person; title: string; done: boolean }[] = [
  { id: "c1", person: "Arika", title: "Feed the fish", done: true },
  { id: "c2", person: "Arika", title: "Tidy bedroom", done: false },
  { id: "c3", person: "Aariv", title: "Pack school bag", done: false },
  { id: "c4", person: "Aariv", title: "Water the plants", done: true },
  { id: "c5", person: "Mum", title: "Library books back", done: false },
  { id: "c6", person: "Da", title: "Bins out (Tuesday)", done: false },
];

export const meals = [
  { day: "Mon", breakfast: "Poha", lunch: "School lunch", dinner: "Dal & rice" },
  { day: "Tue", breakfast: "Porridge", lunch: "School lunch", dinner: "Pasta bake" },
  { day: "Wed", breakfast: "Toast & eggs", lunch: "School lunch", dinner: "Paneer tikka wraps" },
  { day: "Thu", breakfast: "Upma", lunch: "School lunch", dinner: "Fish pie" },
  { day: "Fri", breakfast: "Cereal", lunch: "School lunch", dinner: "Pizza night" },
  { day: "Sat", breakfast: "Aloo paratha", lunch: "Birthday party", dinner: "Chole bhature" },
  { day: "Sun", breakfast: "Pancakes", lunch: "Sunday roast", dinner: "Khichdi" },
];

export const initialShopping: { id: string; aisle: string; item: string; done: boolean }[] = [
  { id: "s1", aisle: "Fruit & veg", item: "Bananas", done: false },
  { id: "s2", aisle: "Fruit & veg", item: "Coriander", done: true },
  { id: "s3", aisle: "Fruit & veg", item: "Onions (2 kg)", done: false },
  { id: "s4", aisle: "Dairy", item: "Whole milk", done: false },
  { id: "s5", aisle: "Dairy", item: "Paneer", done: false },
  { id: "s6", aisle: "Indian groceries", item: "Basmati rice", done: false },
  { id: "s7", aisle: "Indian groceries", item: "Toor dal", done: true },
  { id: "s8", aisle: "Indian groceries", item: "Ghee", done: false },
  { id: "s9", aisle: "Household", item: "Birthday candles", done: false },
  { id: "s10", aisle: "Household", item: "Washing-up liquid", done: false },
];
