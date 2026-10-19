export type CollectionRow={id:string;owner_id:string;name:string;category:string;emoji?:string|null;color:string;description:string;is_public:boolean;cover_item_id?:string|null;created_at:string}
export type ItemRow={id:string;owner_id:string;name:string;brand:string;category:string;notes:string;photo_path:string|null;gallery_paths?:string[]|null;details?:Record<string,string|number|null>;created_at:string}
export type ProfileRow={id:string;username:string;display_name:string;bio:string;created_at:string}
export type LinkRow={collection_id:string;item_id:string}
export const BUCKET='coollects-items'
export const COLLECTION_SELECT='id,owner_id,name,category,emoji,color,description,is_public,cover_item_id,created_at'
export const ITEM_SELECT='id,owner_id,name,brand,category,notes,photo_path,details,created_at'
export const PROFILE_SELECT='id,username,display_name,bio,created_at'
export function publicUrlPath(username:string){return '/u/'+encodeURIComponent(username)}
export function collectionUrlPath(id:string){return '/colecao/'+encodeURIComponent(id)}
export function safeColor(hex:string){return /^#[0-9a-fA-F]{6}$/.test(hex)?hex:'#6125BF'}
export function userError(error:unknown){return error instanceof Error?error.message:'Não foi possível concluir a operação.'}
