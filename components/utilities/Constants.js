//After optimazation URL Bunny dont net url
const WordpresBACKEND_URL = "https://zaanvarcaching.b-cdn.net/api/";
// backend url befor optimization
// const WordpresSlug_URL ="https://d333320jrf5788.cloudfront.net/";
const WordpresSlug_URL = "https://zaanvars3.b-cdn.net/";
// const BACKEND_URL = "https://dev-api.zaanvar.com/api/";
// const BACKEND_URL = "https://dev.zaanvar.com/api/";
// const IMAGE_URL = "https://zaanvaerwebstories.b-cdn.net/";
let BACKEND_URL;
  

if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  if (hostname === "zaanvar.com") {
    BACKEND_URL = "https://prod.zaanvar.com/api/";
  } else {
    BACKEND_URL = "https://dev.zaanvar.com/api/";
    // BACKEND_URL = "https://prod.zaanvar.com/api/";
  }
} else {
  // Server-side environment
  if (process.env.NODE_ENV === 'production') {
    BACKEND_URL = "https://prod.zaanvar.com/api/";
  } else {
    BACKEND_URL = "https://dev.zaanvar.com/api/";
    // BACKEND_URL = "https://prod.zaanvar.com/api/";

  }
}

let IMAGE_URL;
// const IMAGE_URL ="https://zaanvaerwebstories.b-cdn.net/";

if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "zaanvar.com") {
        IMAGE_URL = "https://zaanvarprods3.b-cdn.net/";
    } else {
        IMAGE_URL = "https://zaanvaerwebstories.b-cdn.net/";
        // IMAGE_URL = "https://zaanvarprods3.b-cdn.net/";

    }
  } else {
    // Server-side environment
    if (process.env.NODE_ENV === 'production') {
        IMAGE_URL = "https://zaanvarprods3.b-cdn.net/";
    } else {
      IMAGE_URL = "https://zaanvaerwebstories.b-cdn.net/";
  
    }
  }

// const BACKEND_URL = "https://dev.zaanvar.com/api/";
// const IMAGE_URL = "https://zaanvaerwebstories.b-cdn.net/"


// Local url
// const BACKEND_URL = "http://localhost:5000/api/"; 

// BACKEND_URL for Socket.IO connection
// const SOCKET_SERVER_URL = "https://dev-api.zaanvar.com/";
// const SOCKET_SERVER_URL ="https://dev.zaanvar.com/";
// const SOCKET_SERVER_URL = "http://localhost:5000/";


let SOCKET_SERVER_URL;
  

if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  if (hostname === "zaanvar.com") {
    SOCKET_SERVER_URL = "https://dev.zaanvar.com/";
  } else {
    SOCKET_SERVER_URL = "https://dev.zaanvar.com/";
    // BACKEND_URL = "https://prod.zaanvar.com/api/";
  }
} else {
  // Server-side environment
  if (process.env.NODE_ENV === 'production') {
    SOCKET_SERVER_URL = "https://dev.zaanvar.com/";
  } else {
    SOCKET_SERVER_URL = "https://dev.zaanvar.com/";
    // BACKEND_URL = "https://prod.zaanvar.com/api/";

  }
}

export {
  BACKEND_URL,
  SOCKET_SERVER_URL,
  WordpresBACKEND_URL, 
  WordpresSlug_URL,
  IMAGE_URL
};
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

export const petMenu = [
  {
    name: "Dogs",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2F8bf6fc78b9564227bbd04cfb20fe7a38",
    onClick: "",
  },
  {
    name: "Cats",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2F7b0af6d296624f64bedc4cfaf54e1573",
    onClick: "",
  },
  {
    name: "Rabbit",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2Fbf3fb9d04b6c4fa9a4c87fe75fa2f161",
    onClick: "",
  },
  {
    name: "Others",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2Fd478f65a4b6d43aab66fb3d17a9c590a",
    onClick: "",
  },
];

export const infoMenu = [
  {
    title: "Wide Selection of Breeds",
    text: "Zaanvar offers a diverse range of breeds, ensuring that you can find the appropriate match for your pet.",
  },
  {
    title: "Comprehensive Pet Directory",
    text: "Zaanvar provides a comprehensive database of breeders and pet owners, enabling you to quickly find the suitable match for your pet.",
  },
  {
    title: "User-Friendly Interface",
    text: "Zaanvar is designed with a user-friendly interface, facilitating easy navigation and efficient access to relevant information.",
  },
  {
    title: "Advanced Search Functionality",
    text: "Zaanvar offers advanced search functionality, allowing you to search for pets based on specific criteria such as breed, location, age, and more.",
  },
  {
    title: "Detailed Pet Profiles",
    text: "Zaanvar provides detailed profiles for each pet, including information such as photos, health records, personality traits, and more, to assist you in making informed decisions when buying, adopting, or mating your pet.",
  },
  {
    title: "Personalized Recommendations",
    text: "Zaanvar offers customized recommendations based on each pet’s profile, making it easier for you to find the perfect match.",
  },
];

export const infoMenu2 = [
  {
    title: "Add Your Pet",
    text: "Read verified reviews by pet owners like you and choose a sitter who’s a great.",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2F345e40ca4509490aaf55018ac1c11e7f",
  },
  {
    title: "Select a Match",
    text: "Read verified reviews by pet owners like you and choose a sitter who’s a great.",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2Fa290c190efca43fbb8d8c3c5d0d67626",
  },
  {
    title: "Communicate",
    text: "Read verified reviews by pet owners like you and choose a sitter who’s a great.",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F5a43bde1430945df91be58586dabe0db%2F6928d372c1454c96adc239bf3170db48",
  },
];

export const faq = [
  {
    question: "What types of pet services are available on Zaanvar?",
    answer: [
      {
        title: "Pet Mate Finder:",
        text: "Zaanvar has a feature that enables users to find compatible pets for mating based on breed, size, and activity level.",
      },
      {
        title: "Pets for Adoption:",
        text: "Pet owners can advertise their pets for adoption and communicate with potential adopters to facilitate the process.",
      },
      {
        title: "Pets for Sale:",
        text: "Pet breeders and owners can list their pets for sale, allowing prospective buyers to connect with them.",
      },
    ],
    visible: true,
    id: 1,
  },
  {
    question: "How can I list my pet on Zaanvar?",
    answer: [
      {
        title: "Pet Mate Finder:",
        text: "Zaanvar has a feature that enables users to find compatible pets for mating based on breed, size, and activity level.",
      },
      {
        title: "Pets for Adoption:",
        text: "Pet owners can advertise their pets for adoption and communicate with potential adopters to facilitate the process.",
      },
      {
        title: "Pets for Sale:",
        text: "Pet breeders and owners can list their pets for sale, allowing prospective buyers to connect with them.",
      },
    ],
    visible: false,
    id: 2,
  },
  {
    question: "Is Zaanvar a free platform?",
    answer: [
      {
        title: "Pet Mate Finder:",
        text: "Zaanvar has a feature that enables users to find compatible pets for mating based on breed, size, and activity level.",
      },
      {
        title: "Pets for Adoption:",
        text: "Pet owners can advertise their pets for adoption and communicate with potential adopters to facilitate the process.",
      },
      {
        title: "Pets for Sale:",
        text: "Pet breeders and owners can list their pets for sale, allowing prospective buyers to connect with them.",
      },
    ],
    visible: false,
    id: 3,
  },
];


// Utility to recursively replace dev domain
export const replaceDevDomain = (data) => {
  if (typeof data === 'string') {
    return data.replace(/dev-wp-api\.zaanvar\.com/g, 'zaanvar.com');
  } else if (Array.isArray(data)) {
    return data.map(replaceDevDomain);
  } else if (typeof data === 'object' && data !== null) {
    const replaced = {};
    for (const key in data) {
      replaced[key] = replaceDevDomain(data[key]);
    }
    return replaced;
  }
  return data;
};