import Axios from "axios";
import swal from "sweetalert";
import { BACKEND_URL, SOCKET_SERVER_URL, WordpresBACKEND_URL, WordpresSlug_URL, } from "./Constants";

// Set global timeout for all Axios requests
Axios.defaults.timeout = 10000; // 10 seconds

export class WebApimanager {
  constructor(jwtToken) {
    this.jwtToken = jwtToken;
  }

  async post(url, data) {
    try {
      

      const headers = {

  Authorization: `Bearer ${this.jwtToken}`,
  "Content-Type": "application/json",
};

const response = await Axios.post(BACKEND_URL + url, data, { headers });

if (response.status >= 200 && response.status < 500) {

//   const { token, userInfo } = response.data;

//   // Save the JWT token and userInfo to sessionStorage
//   sessionStorage.setItem("jwtToken", token); // Save to sessionStorage
//   sessionStorage.setItem("userInfo", JSON.stringify(userInfo)); // Save userInfo to sessionStorage

//   // Save to Zustand store
//   this.jwtToken(token); // Save to Zustand
//   this.setUserInfo({
//     name: userInfo.name,
//     email: userInfo.email,
//     ID: userInfo._id,
//   });

  return response.data;
} else {
  throw new Error( `Unexpected status code: ${response.status}`);
}
} catch (error) {
//    // swal("Failure", "Something went wrong. Please try again later.", "error");
throw error;
}
}
async Namegeneratorpost(url, data) {
  try {
    

    const headers = {
"Content-Type": "application/json",
};

const response = await Axios.post(WordpresBACKEND_URL + url, data, { headers });

if (response.status >= 200 && response.status < 500) {
// console.log("Response data:", response.data);

//   const { token, userInfo } = response.data;

//   // Save the JWT token and userInfo to sessionStorage
//   sessionStorage.setItem("jwtToken", token); // Save to sessionStorage
//   sessionStorage.setItem("userInfo", JSON.stringify(userInfo)); // Save userInfo to sessionStorage

//   // Save to Zustand store
//   this.jwtToken(token); // Save to Zustand
//   this.setUserInfo({
//     name: userInfo.name,
//     email: userInfo.email,
//     ID: userInfo._id,
//   });

return response.data;
} else {
throw new Error(`Unexpected status code: ${response.status}`);
}
} catch (error) {
   // swal("Failure", "Something went wrong. Please try again later.", "error");
throw error;
}
}

// async get(url) {
//   try {
//     const headers = {
//       Authorization: Bearer  ${this.jwtToken},

//       "Content-Type": "application/json",
//     };

//     const response = await Axios.get(BACKEND_URL + url, { headers });

//     if (respo
// nse.status >= 200 && response.status < 500) {
      
//       // Handle response data if needed
//       return response.data;
//     } else {
//       throw new Error(Unexpected status code: ${response.status});
//     }
//   } catch (error) {
//     //    // swal("Failure", "Something went wrong. Please try again later.", "error");
//     throw error;
//   }
// }
async get(url, qs) {
  try {
    let baseURL = BACKEND_URL;
    let jwttoken =`${this.jwtToken}`;
    let headers = {
      Authorization: "Bearer " + jwttoken,
      // jwtToken: jwttoken,
      "Content-Type": "application/json",
    };
    return Axios.get(baseURL + url, { 
      headers, 
      params: qs,
      timeout: 10000 
    })
      .then((res) => {
        if (res.status >= 200 && res.status < 500) {
          return res || [];
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          //Setting a Custom error message if authorization failed
          error.customErrorMessage =
            "Apologies! An error occurred. Please log in again to continue.";
        }

        throw error;
      });
  } catch (e) {
    // swal(
    //   Failure,
    //   Something went wrong. Please try again after sometime.,
    //   "error"
    // );
  }
}

async getwordpressSlugData(url, data) {
  try {
    const headers = {
      Authorization: "Bearer ",
      "Content-Type": "application/json",
    };

    const response = await Axios.get(WordpresSlug_URL + url, data, { headers });

    if (response.status >= 200 && response.status < 500) {
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
       // swal("Failure", "Something went wrong. Please try again later.", "error");
    throw error;
    }
  }




  // Post without token
  async postwithouttoken(url, data) {
    try {
      const headers = {
        Authorization: "Bearer ",
        "Content-Type": "application/json",
      };

      const response = await Axios.post(BACKEND_URL + url, data, { headers });

      if (response.status >= 200 && response.status < 500) {
        // console.log("Response data:", response.data);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
         // swal("Failure", "Something went wrong. Please try again later.", "error");
      throw error;
    }
  }
async putwithouttoken(url, data) {
  try {
    const headers = {
      Authorization: "Bearer ",
      "Content-Type": "application/json",
    };

    const response = await Axios.put(BACKEND_URL + url, data, { headers });

    if (response.status >= 200 && response.status < 500) {
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
       // swal("Failure", "Something went wrong. Please try again later.", "error");
    throw error;
    }
  }
async getwithouttoken(url, data) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const response = await Axios.get(BACKEND_URL + url, data, { 
      headers,
      timeout: 10000 // 10 second timeout
    });

    if (response.status >= 200 && response.status < 500) {
      return response;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    //    // swal("Failure", "Something went wrong. Please try again later.", "error");
    throw error;
  }
}

async delete(url, data) {
  try {
    let baseURL = BACKEND_URL;
    let jwttoken = this.jwtToken;
    // let jwttoken = Store.get("JWTTOKEN");
    //   let jwtToken = Store.get("jwtToken");
    let headers = {
      Authorization: "Bearer " + jwttoken,
      // jwtToken: jwtToken,
      "Content-Type": "application/json",
    };
    return await Axios.delete(baseURL + url, {
      data: JSON.stringify(data),
      headers,
    })
      .then((res) => {
        if (res.status >= 200 && res.status < 500) {
          return res;
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          //Setting a Custom error message if authorization failed
          error.customErrorMessage =
            "Apologies! An error occurred. Please log in again to continue.";
        }

        throw error;
      });
  } catch (e) {
       // swal("Failure", "Something went wrong. Please try again later.", "error");
  }
}
async put(url, data) {
  try {
    let baseURL = BACKEND_URL;
    let jwttoken = `${this.jwtToken}`;
    //   let jwttoken = Store.get("JWTTOKEN");
    //   let jwtToken = Store.get("jwtToken");
    let headers = {
      Authorization: "Bearer " + jwttoken,
      // jwtToken: jwtToken,
      "Content-Type": "application/json",
    };
    return await Axios.put(baseURL + url, data, { headers })
      .then((res) => {
        if (res.status >= 200 && res.status < 500) {
          return res;
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          //Setting a Custom error message if authorization failed
          error.customErrorMessage =
            "Apologies! An error occurred. Please log in again to continue.";
        }

        throw error;
      });
  } catch (e) {
    // swal(
    //   'Failure',
    //   Something went wrong. Please try again after sometime.,
    //   "error"
    // );
  }
}



// async imagePut(url, data) {
//     try {
//       let baseURL = BACKEND_URL;
//       let jwttoken = ${this.jwtToken};
//       //   let jwttoken = Store.get("JWTTOKEN");
//       //   let jwtToken = Store.get("jwtToken");
//       let headers = {
//         Authorization: "Bearer " + jwttoken,
//         // jwtToken: jwtToken,
//         "Content-Type": "multipart/form-data",
//       };
//       return Axios.put(baseURL + url, data, { headers })
//         .then((res) => {
//           if (res.status >= 200 && res.status < 500) {
//             return res;
//           } else {
//             throw new Error(Unexpected status code: ${res.status});
//           }
//         })
//         .catch((error) => {
//           if (error.response && error.response.status === 401) {
//             //Setting a Custom error message if authorization failed
//             error.customErrorMessage =
//               "Apologies! An error occurred. Please log in again to continue.";
//           }

//           throw error;
//         });
//     } catch (e) {
//       swal(
//         Failure,
//         Something went wrong. Please try again after sometime.,
//         "error"
//       );
//     }
//   }
async imagePut(url, data) {
    try {
      let baseURL = BACKEND_URL;
      let jwttoken = `${this.jwtToken}`;
      //   let jwttoken = Store.get("JWTTOKEN");
      //   let jwtToken = Store.get("jwtToken");
      let headers = {
        Authorization: "Bearer " + jwttoken,
        // jwtToken: jwtToken,
       "Content-Type": "multipart/form-data",
      };
      return await Axios.put(baseURL + url, data, { headers })
        .then((res) => {
          if (res.status >= 200 && res.status < 500) {
            // console.log("Response data:", res.data);
            return res;
          } else {
            throw new Error(`Unexpected status code: ${res.status}`);
          }
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            //Setting a Custom error message if authorization failed
            error.customErrorMessage =
              "Apologies! An error occurred. Please log in again to continue.";
          }
  
          throw error;
        });
    } catch (e) {
      // swal(
      //   'Failure',
      //   Something went wrong. Please try again after sometime.,
      //   "error"
      // );
    }
  }
  async imagePost(url, data) {
    try {
      

      const headers = {

  Authorization: `Bearer ${this.jwtToken}`,
 "Content-Type": "multipart/form-data",
};

const response = await Axios.post(BACKEND_URL + url, data, { headers });

if (response.status >= 200 && response.status < 500) {

  const { token, userInfo } = response.data;

  return response.data;
} else {
  throw new Error(`Unexpected status code: ${response.status}`);
}
} catch (error) {
   // swal("Failure", "Something went wrong. Please try again later.", "error");
throw error;
}
}
//   async imagePost(url, data) {
//     try {
//       let baseURL = BACKEND_URL;
//       let jwttoken = ${this.jwtToken};
//       //   let jwttoken = Store.get("JWTTOKEN");
//       //   let jwtToken = Store.get("jwtToken");
//       let headers = {
//         Authorization: "Bearer " + jwttoken,
//         // jwtToken: jwtToken,
//         "Content-Type": "multipart/form-data",
//       };
//       return Axios.post(baseURL + url, data, { headers })
//         .then((res) => {
//           if (res.status >= 200 && res.status < 500) {
//             return res;
//           } else {
//             throw new Error(Unexpected status code: ${res.status});
//           }
//         })
//         .catch((error) => {
//           if (error.response && error.response.status === 401) {
//             //Setting a Custom error message if authorization failed
//             error.customErrorMessage =
//               "Apologies! An error occurred. Please log in again to continue.";
//           }

//           throw error;
//         });
//     } catch (e) {
//       swal(
//         Failure,
//         Something went wrong. Please try again after sometime.,
//         "error"
//       );
//     }
//   }


async getwithouturltoken(url, data) {
  try {
    const headers = {
      
      "Content-Type": "application/json",
    };

    const response = await Axios.get(url, data, { headers });

    if (response.status >= 200 && response.status < 500) {
      return response;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    //    // swal("Failure", "Something went wrong. Please try again later.", "error");
    throw error;
    }
  }


}