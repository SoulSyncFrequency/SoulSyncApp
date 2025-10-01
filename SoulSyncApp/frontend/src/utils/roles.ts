export function canSeeAdmin(user:any){ return !!(user && Array.isArray(user.roles) && user.roles.includes('admin')) }
