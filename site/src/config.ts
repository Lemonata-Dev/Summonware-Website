// Site-wide switches that don't belong to any one module.
//
// MAINTENANCE_MODE: this is a static site with no server/env vars at
// runtime, so there's no admin toggle — flipping this to true and
// redeploying (push to main, or merge a PR that does) replaces every
// route with the Coming Soon page until it's flipped back.
export const MAINTENANCE_MODE = false;
