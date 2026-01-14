import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

class ScraperService:
    def analyze_url(self, url):
        try:
            # Basic validation
            if not url.startswith(('http://', 'https://')):
                return {'success': False, 'error': 'Invalid URL format'}

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Extract Metadata
            title = soup.title.string if soup.title else 'No Title'
            description = ''
            meta_desc = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
            if meta_desc:
                description = meta_desc.get('content', '')
                
            # Structure Analysis
            analysis = {
                'url': url,
                'domain': urlparse(url).netloc,
                'title': title.strip() if title else '',
                'description': description.strip(),
                'links_count': len(soup.find_all('a')),
                'images_count': len(soup.find_all('img')),
                'h1_count': len(soup.find_all('h1')),
                'h2_count': len(soup.find_all('h2')),
                'tables_count': len(soup.find_all('table')),
                'lists_count': len(soup.find_all(['ul', 'ol'])),
                # Preview structure candidates (e.g., classes used often)
                'preview_text': soup.get_text(separator=' ', strip=True)[:200] + '...'
            }
            
            return {'success': True, 'data': analysis}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
