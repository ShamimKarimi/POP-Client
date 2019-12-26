
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  // Define API
  apiURL = 'http://localhost:3000';

  constructor(private http: HttpClient) { }
    
    send(message: string) {
      let data = JSON.stringify({'message': message});
      return this.http.post(this.apiURL, data, 
        {
          responseType: 'text',
          headers: new HttpHeaders().set('Content-Type', 'application/json')
        })
      .subscribe(res => {
        console.log(res);
     });
    }

}

 
