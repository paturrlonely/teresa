export const useLimit = (user, amount = 1) => {
  if (user.isOwner || user.isPremium) return true;
  if (user.limit < amount) return false;
  user.limit -= amount;
  return true;
};