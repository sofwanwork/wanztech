import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/(dashboard)/', '/builder/', '/ecert/builder/', '/settings/', '/certificates/'],
            },
        ],
        sitemap: 'https://klikform.com/sitemap.xml',
    };
}
