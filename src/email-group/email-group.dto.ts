export class CreateEmailGroupDto {
    name: string;
    keywords: string[];
    chatId: string;
}

export class UpdateEmailGroupDto {
    name?: string;
    keywords?: string[];
    chatId?: string;
}