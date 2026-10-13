export type CollectionRow={id:string;owner_id:string;name:string;category:string;color:string;description:string;is_public:boolean;created_at:string}
export type ItemRow={id:string;owner_id:string;name:string;brand:string;category:string;notes:string;photo_path:string|null;created_at:string}
export type ProfileRow={id:string;username:string;display_name:string;bio:string;created_at:string}
export type LinkRow={collection_id:string;item_id:string}
export const BUCKET='coollects-items'
export const COLLECTION_SELECT='id,owner_id,name,category,color,description,is_public,created_at'
export const ITEM_SELECT='id,owner_id,name,brand,category,notes,photo_path,created_at'
export const PROFILE_SELECT='id,username,display_name,bio,created_at'
export function publicUrlPath(username:string){return '/u/'+encodeURIComponent(username)}
export function collectionUrlPath(id:string){return '/colecao/'+encodeURIComponent(id)}
export function safeColor(hex:string){return /^#[0-9a-fA-F]{6}$/.test(hex)?hex:'#6125BF'}
export function userError(error:unknown){return error instanceof Error?error.message:'Não foi possível concluir a operação.'}
