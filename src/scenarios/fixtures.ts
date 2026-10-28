import { VisitorInput, CallOutcome, CallResultInput } from "../domain/types";

export type ScenarioFixture = {
  id: string;
  title: string;
  metadata: VisitorInput;
  callerBehavior: string;
  expectedExtractedFields: Partial<CallResultInput>;
  expectedOutcome: CallOutcome;
  requirement: string;
};

const completeQualification = {
  preferredCity: { value: "Gurgaon", status: "confirmed" as const },
  genderPreference: { value: "any", status: "confirmed" as const },
  monthlyBudgetInr: { amount: 16000, isApproximate: false, status: "confirmed" as const },
  moveInDate: { isoDate: "2027-01-15", statedText: null, status: "exact" as const },
  stayDuration: { months: 6, statedText: null, status: "exact" as const },
};

export const scenarioFixtures: ScenarioFixture[] = [
  {
    id: "scenario-01",
    title: "Complete metadata, all correct",
    metadata: {
      name: "Synthetic Visitor 01",
      phone: "+91 00000 00001",
      city: "Gurgaon",
      gender: "any",
      budget: { amount: 16000, isApproximate: false },
    },
    callerBehavior:
      "Confirms the saved details and gives clear move-in and stay-duration information.",
    expectedExtractedFields: {
      customerName: { value: "Synthetic Visitor 01", status: "confirmed" },
      contactPhone: { value: "+91 00000 00001", status: "confirmed" },
      ...completeQualification,
    },
    expectedOutcome: "completed",
    requirement: "Reconfirm existing metadata, then capture the remaining qualification fields.",
  },
  {
    id: "scenario-02",
    title: "Completely missing metadata",
    metadata: { name: null, phone: null, city: null, gender: null, budget: null },
    callerBehavior:
      "Provides contact details and PG preferences during the call after being asked one item at a time.",
    expectedExtractedFields: {
      customerName: { value: "Synthetic Visitor 02", status: "provided" },
      contactPhone: { value: "+91 00000 00002", status: "provided" },
      preferredCity: { value: "Bengaluru", status: "provided" },
      genderPreference: { value: "female", status: "provided" },
      monthlyBudgetInr: { amount: 18500, isApproximate: true, status: "provided" },
      moveInDate: { isoDate: "2027-02-01", statedText: null, status: "exact" },
      stayDuration: { months: 9, statedText: null, status: "exact" },
    },
    expectedOutcome: "completed",
    requirement: "Never assume any visitor field is present; collect missing name and phone too.",
  },
  {
    id: "scenario-03",
    title: "Partial metadata",
    metadata: {
      name: "Synthetic Visitor 03",
      city: "Chennai",
      budget: { amount: 14000, isApproximate: true },
    },
    callerBehavior:
      "Confirms the saved name, city and approximate budget; the other preferences are gathered naturally.",
    expectedExtractedFields: {
      ...completeQualification,
      customerName: { value: "Synthetic Visitor 03", status: "confirmed" },
      preferredCity: { value: "Chennai", status: "confirmed" },
      monthlyBudgetInr: { amount: 14000, isApproximate: true, status: "confirmed" },
      contactPhone: { value: "+91 00000 00003", status: "provided" },
      genderPreference: { value: "male", status: "provided" },
    },
    expectedOutcome: "completed",
    requirement: "Ask only for fields that are still missing or unclear.",
  },
  {
    id: "scenario-04",
    title: "Incorrect metadata corrected",
    metadata: {
      name: "Synthetic Visitor 04",
      phone: "+91 00000 00004",
      city: "Gurgaon",
      budget: { amount: 12000, isApproximate: false },
    },
    callerBehavior: "Corrects the saved city and budget after hearing them read back.",
    expectedExtractedFields: {
      ...completeQualification,
      customerName: { value: "Synthetic Visitor 04", status: "confirmed" },
      preferredCity: { value: "Mysuru", status: "corrected" },
      monthlyBudgetInr: { amount: 17000, isApproximate: false, status: "corrected" },
    },
    expectedOutcome: "completed",
    requirement: "Apply corrections over stored values and retain old/new/source audit entries.",
  },
  {
    id: "scenario-05",
    title: "Busy customer",
    metadata: { name: "Synthetic Visitor 05", phone: "+91 00000 00005", city: "Gurgaon" },
    callerBehavior:
      "Says they cannot talk now and asks to be contacted later without choosing a precise time.",
    expectedExtractedFields: {
      callOutcome: "busy",
      nextAction: "schedule_callback_manually",
      callbackScheduled: false,
    },
    expectedOutcome: "busy",
    requirement: "A request to reconnect is not a scheduled callback or completed qualification.",
  },
  {
    id: "scenario-06",
    title: "Wrong number",
    metadata: { name: "Synthetic Visitor 06", phone: "+91 00000 00006" },
    callerBehavior: "Says the number belongs to someone else and does not discuss accommodation.",
    expectedExtractedFields: { callOutcome: "wrong_number", nextAction: "do_not_contact" },
    expectedOutcome: "wrong_number",
    requirement: "Wrong-number classification outranks all other outcomes.",
  },
  {
    id: "scenario-07",
    title: "Not interested",
    metadata: { name: "Synthetic Visitor 07", phone: "+91 00000 00007", city: "Bengaluru" },
    callerBehavior: "Clearly declines accommodation help and asks not to be contacted again.",
    expectedExtractedFields: { callOutcome: "not_interested", nextAction: "do_not_contact" },
    expectedOutcome: "not_interested",
    requirement: "Respect a clear opt-out and do not continue qualification.",
  },
  {
    id: "scenario-08",
    title: "Uncertain move-in date",
    metadata: {
      name: "Synthetic Visitor 08",
      city: "Chennai",
      gender: "any",
      budget: { amount: 20000, isApproximate: true },
    },
    callerBehavior:
      "Gives an approximate move-in period rather than a confirmed day, while answering other qualification questions.",
    expectedExtractedFields: {
      ...completeQualification,
      moveInDate: { isoDate: null, statedText: "around March 2027", status: "tentative" },
    },
    expectedOutcome: "completed",
    requirement: "Preserve tentative dates as tentative; do not turn them into exact dates.",
  },
  {
    id: "scenario-09",
    title: "Natural Hinglish conversation",
    metadata: { name: "Synthetic Visitor 09", phone: "+91 00000 00009", city: "Gurgaon" },
    callerBehavior:
      "Switches comfortably between Hindi and English while describing a PG preference.",
    expectedExtractedFields: { ...completeQualification, languageUsed: "hinglish" },
    expectedOutcome: "completed",
    requirement: "Support natural Hindi-English conversation without inferring missing facts.",
  },
  {
    id: "scenario-10",
    title: "English-preferring customer",
    metadata: {
      name: "Synthetic Visitor 10",
      phone: "+91 00000 00010",
      city: "Hyderabad",
      gender: "female",
      budget: { amount: 22000, isApproximate: false },
    },
    callerBehavior: "Prefers to continue in English and provides concise answers.",
    expectedExtractedFields: {
      ...completeQualification,
      preferredCity: { value: "Hyderabad", status: "confirmed" },
      languageUsed: "english",
    },
    expectedOutcome: "completed",
    requirement: "Follow the caller's language preference and accept free-text city values.",
  },
  {
    id: "scenario-11",
    title: "Interruption and repetition",
    metadata: {
      name: "Synthetic Visitor 11",
      phone: "+91 00000 00011",
      city: "Bengaluru",
      gender: "male",
    },
    callerBehavior: "Pauses, interrupts a question, then repeats the budget after a clarification.",
    expectedExtractedFields: {
      ...completeQualification,
      preferredCity: { value: "Bengaluru", status: "confirmed" },
      monthlyBudgetInr: { amount: 19000, isApproximate: true, status: "confirmed" },
    },
    expectedOutcome: "completed",
    requirement:
      "Handle interruption and repetition without duplicating or losing captured values.",
  },
  {
    id: "scenario-12",
    title: "Unsupported question",
    metadata: { name: "Synthetic Visitor 12", city: "Gurgaon" },
    callerBehavior:
      "Asks for exact live prices, availability, and listings that are not provided to the agent.",
    expectedExtractedFields: { callOutcome: "partial", nextAction: "follow_up_call" },
    expectedOutcome: "partial",
    requirement: "Do not invent prices, availability, or listing details.",
  },
  {
    id: "scenario-13",
    title: "Phone-number correction",
    metadata: {
      name: "Synthetic Visitor 13",
      phone: "+91 00000 00013",
      city: "Chennai",
      gender: "female",
    },
    callerBehavior:
      "Corrects the phone number on the record, then completes the accommodation questions.",
    expectedExtractedFields: {
      contactPhone: { value: "+91 00000 00099", status: "corrected" },
      ...completeQualification,
      preferredCity: { value: "Chennai", status: "confirmed" },
    },
    expectedOutcome: "completed",
    requirement:
      "Use corrected contact details, audit the change, and keep full phone numbers out of summaries/logs.",
  },
  {
    id: "scenario-14",
    title: "Callback versus completed distinction",
    metadata: {
      name: "Synthetic Visitor 14",
      phone: "+91 00000 00014",
      city: "Gurgaon",
      gender: "any",
    },
    callerBehavior:
      "Requests a callback after work but does not complete qualification or agree to a scheduled slot.",
    expectedExtractedFields: {
      callOutcome: "callback_requested",
      callbackScheduled: false,
      callbackRequestedTime: "after work",
      nextAction: "schedule_callback_manually",
    },
    expectedOutcome: "callback_requested",
    requirement: "Never treat callback_requested as completed or set callbackScheduled true.",
  },
];
