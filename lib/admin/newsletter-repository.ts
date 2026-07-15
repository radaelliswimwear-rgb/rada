import {
  createCampaignAction,
  listCampaignsAction,
  listSubscribersAction,
  markCampaignSentAction,
} from "./newsletter-actions";

export const adminNewsletterRepository = {
  listSubscribers: listSubscribersAction,
  listCampaigns: listCampaignsAction,
  createCampaign: createCampaignAction,
  markCampaignSent: markCampaignSentAction,
};
