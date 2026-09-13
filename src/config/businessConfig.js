// Customize this file when adapting the application for another business.
// Keep credentials in environment variables, never in this configuration.
const businessConfig = {
  businessName: 'Cloud Laundry',
  welcomeMessage: 'Welcome to Cloud Laundry! Our automated assistant can register your details for laundry services.',
  services: [
    { id: 'SERVICE_WASH_FOLD', title: 'Wash & Fold', value: 'Wash & Fold' },
    { id: 'SERVICE_DRY_CLEANING', title: 'Dry Cleaning', value: 'Dry Cleaning' },
    { id: 'SERVICE_IRONING', title: 'Ironing', value: 'Ironing' }
  ],
  businessHours: 'Monday-Saturday\n8:00 AM-6:00 PM',
  companyInfo: 'Cloud Laundry provides professional washing, dry-cleaning and ironing services.',
  chatbot: {
    registrationIntro: "Let's register your details.\n\nPlease enter your full name.\nExample: Nimal Perera\n\nYou can type CANCEL at any time.",
    addressQuestion: 'Please enter your pickup address.\n\nExample:\nNo. 25, Main Road, Malabe',
    consentText: 'will store the information you provide so that we can contact you and provide requested services.',
    mainMenuButtons: [
      { id: 'REGISTER_DETAILS', title: 'Register Details' },
      { id: 'COMPANY_INFO', title: 'Company Info' },
      { id: 'TALK_TO_STAFF', title: 'Talk to Staff' }
    ]
  }
};

module.exports = businessConfig;
