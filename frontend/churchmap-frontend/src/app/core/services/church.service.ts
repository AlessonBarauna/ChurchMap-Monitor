import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResult } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChurchService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  search(location: string): Observable<SearchResult> {
    return this.http.post<SearchResult>(`${this.base}/api/churches/search`, { location });
  }
}
