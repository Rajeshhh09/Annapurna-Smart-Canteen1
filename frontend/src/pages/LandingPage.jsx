import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   Annapurna Smart Canteen — Landing Page
   Wired to React Router:
     "Order Now" / "Get Started" / dish "Add to Cart" → /login  (or /menu if already logged in)
     "Login"  nav btn → /login
     "Sign Up" nav btn → /register
     Hero "Explore Menu" → scrolls to #dishes section
   ───────────────────────────────────────────────────────────── */

const API = 'https://annapurna-smart-canteen1.onrender.com';

// ── Static data ───────────────────────────────────────────────────────────────
const RESTAURANTS = [
  { name:'Main Campus Canteen', cuisine:'South Indian · North Indian · Snacks', rating:'4.8', reviews:'320', time:'12–18', from:'₹30', tag:'⚡ Fast',    img:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80&auto=format&fit=crop' },
  { name:'Snack Corner',        cuisine:'Street Food · Beverages · Chaat',       rating:'4.7', reviews:'210', time:'8–14',  from:'₹15', tag:'🔥 Trending', img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&auto=format&fit=crop' },
  { name:'The Mess Hall',       cuisine:'Thali · Rice · Dal · Sabzi',             rating:'4.5', reviews:'180', time:'10–20', from:'₹50', tag:'🥗 Healthy',  img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop' },
  { name:'Café Annapurna',      cuisine:'Coffee · Sandwiches · Pastries',         rating:'4.9', reviews:'400', time:'5–10',  from:'₹40', tag:'☕ Café',     img:'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80&auto=format&fit=crop' },
];

const DISHES = [
  // { name:'Samosa',      desc:'Crispy golden pastry filled with spiced potato, peas & herbs',  price:'₹15',  time:'5',  rating:'4.8', stars:'★★★★★', cat:'snacks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Samosa2.jpg/500px-Samosa2.jpg' },
  // { name:'Vada Pav',    desc:'Mumbai s iconic spiced potato fritter in a soft pav with chutney', price:'₹25',  time:'7',  rating:'4.9', stars:'★★★★★', cat:'snacks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Vada_pav_at_Anand.jpg/500px-Vada_pav_at_Anand.jpg' },
  { name:'Pani Puri',   desc:'Hollow crispy puris filled with tangy spiced water & potato',   price:'₹30',  time:'5',  rating:'4.9', stars:'★★★★★', cat:'chaat',  img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Golgappa_Pani_Puri_India.jpg/500px-Golgappa_Pani_Puri_India.jpg' },
  { name:'Bhel Puri',   desc:'Puffed rice tossed with veggies, sev & sweet-tangy chutneys',   price:'₹35',  time:'5',  rating:'4.7', stars:'★★★★☆', cat:'chaat',  img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/CHATPATI_BHELPURI.JPG/500px-CHATPATI_BHELPURI.JPG' },
  { name:'Sev Puri',    desc:'Crispy puris topped with potato, sev, onion & chutneys',        price:'₹35',  time:'5',  rating:'4.7', stars:'★★★★☆', cat:'chaat',  img:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Sev_puri.jpg/500px-Sev_puri.jpg' },
  { name:'Dahi Puri',   desc:'Puris stuffed with potato, creamy yogurt & tangy chutneys',     price:'₹40',  time:'5',  rating:'4.8', stars:'★★★★★', cat:'chaat',  img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Dahi_puri.jpg/500px-Dahi_puri.jpg' },
  { name:'Dabeli',      desc:'Kutchi burger — spiced potato in pav with peanuts & pomegranate', price:'₹30',  time:'7',  rating:'4.8', stars:'★★★★★', cat:'snacks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Dabeli.jpg/500px-Dabeli.jpg' },
  { name:'Kachori',     desc:'Flaky fried pastry stuffed with spiced lentils & served with chutney', price:'₹20', time:'8', rating:'4.6', stars:'★★★★☆', cat:'snacks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Kachori.jpg/500px-Kachori.jpg' },
  { name:'Manchurian',  desc:'Crispy fried dumplings tossed in Indo-Chinese spicy soy sauce',  price:'₹80',  time:'15', rating:'4.7', stars:'★★★★☆', cat:'snacks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Gobi_Manchurian.jpg/500px-Gobi_Manchurian.jpg' },
  // { name:'Masala Chai', desc:'Freshly brewed Indian spiced tea with ginger, cardamom & milk',  price:'₹20',  time:'5',  rating:'4.9', stars:'★★★★★', cat:'drinks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Masala-chai.jpg/500px-Masala-chai.jpg' },
  { name:'Lassi',       desc:'Chilled creamy yogurt-based drink — sweet or salted to taste',   price:'₹40',  time:'3',  rating:'4.8', stars:'★★★★★', cat:'drinks', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Lassi.jpg/500px-Lassi.jpg' },
];

const WHY_CARDS = [
  { icon:'⚡', title:'Fast Delivery',      desc:'Average delivery in under 20 minutes. Live ETA shown on every order so you\'re never left guessing.' },
  { icon:'📍', title:'Live Order Tracking',desc:'Watch your order move from kitchen to your hands in real time. No more wondering "where\'s my food?"' },
  { icon:'🔒', title:'Secure Payments',    desc:'Pay via Razorpay-powered UPI or cash on delivery. Your transactions are 100% encrypted.' },
  { icon:'🌙', title:'24/7 Support',       desc:'Study nights covered. Special late-night menu and live support available until midnight.' },
];

const TESTIMONIALS = [
  { text:'Honestly the best thing that happened to our hostel. I order breakfast before waking up and it arrives perfectly timed. The Masala Dosa is elite.', name:'Rajesh Kumar',  role:'B.Tech CSE, 2nd Year', img:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80&auto=format&fit=crop&crop=face' },
  { text:'The live tracking feature is genuinely so satisfying to watch. I used to hate not knowing when food would arrive. Now I know to the minute.',      name:'Priya Sharma',   role:'MBA, 1st Year',       img:'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&auto=format&fit=crop&crop=face' },
  { text:'Never thought campus food could feel premium. The app is slick, the food is fresh, and the UPI payment works flawlessly. 10/10 would recommend.',  name:'Arjun Mehta',    role:'M.Tech ECE, 3rd Sem', img:'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=100&q=80&auto=format&fit=crop&crop=face' },
  { text:'As a hostelite I rely on this every single day. Paneer Butter Masala is my comfort food. They never mess it up, always consistent and hot.',       name:'Ananya Singh',   role:'BCA, Final Year',     img:'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&q=80&auto=format&fit=crop&crop=face' },
];

const LOGO_URI = `data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAHzAmsDASIAAhEBAxEB/8QAHAABAQEBAQADAQAAAAAAAAAAAAEHCAYCBAUD/8QARBABAAECBAIGBgYIBgICAwAAAAECAwQFBhEXkwchMVRV0hJBgZHR0xMiUWFxoQgUFjJCUrHBFSNicpKyJMI14URzgv/EABsBAQEBAQEBAQEAAAAAAAAAAAABBgcFAwQC/8QANxEBAAECAQcKBgIDAQEBAAAAAAECBAMFBhEVUmGRFiExQUNTgaHB4RITUXGCwhSxItHwI0Lx/9oADAMBAAIRAxEAPwDmIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABo/B7UHi2Scy98pnDrGXj5WvcW1+D5fXp9GkzfyXgX/zPnaf8dGjRv0/6Yrwe1B4tknMvfKOD2oPFsk5l75TaR4+u7rdwaPkvY7+LFuD2oPFsk5l75Rwe1B4tknMvfKbTuGu7rdwOS9jv4+zFuD2oPFsk5l75Rwe1B4tknMvfKbSGu7rdwOS9jv4+zF+D2oPF8k5l75ScHtQeL5JzL3ym07m5ru63cDkvY7+Psxbg9qDxbJOZe+UcHtQeL5JzL3ym0hru63cDkvY7+Psxbg9qHxbJOZe+UcHtQeLZJzL3ym07hru63cDkvY7+Psxbg9qDxbJOZe+UcH9QeLZJzL3ym0m5ru63cDkvY7+LFuD2ofFsk5l75Rwe1B4tknMvfKbSGu7rdwOS9jv4sW4Pag8WyTmXvlHB7UHi+Scy98ptIa7ut3BeS9hv4+zFuD2oPF8k5l75Rwe1B4tknMvfKbTuGu7rdwOS1jv4+zFuD2oPFsk5l75Rwe1B4tknMvfKbSGu7rdwTkvY7+Psxbg9qDxbJOZe+UcHtQeLZJzL3ym0hru63cF5L2G/j7MW4Pah8WyTmXvlHB7UHi2Scy98ptO6mu7rdwTkvY7+Psxbg9qHxbJOZe+UcHtQeLZJzL3ym0m/Ua7ut3A5L2O/j7MW4O6g8XyTmXvlHB7UHi+Scy98ptIa7ut3A5L2O/j7MW4O6g8XyTmXvlHB3UPi+Scy98ptO4a7ut3A5L2O/j7MW4O6g8XyTmXvlHB3UHi+R8y/wDKbSbmu7rdwOS9jv4+zFuDuoPF8j5l/wCUcHdQeL5HzL/ym07m5ru63cDkvY7+Psxbg7qDxfI+Zf8AlHB7UHi+Scy/8ptBua7ut3A5L2O/j7MW4Pag8XyTmXvlHB7UHi+Scy98ptJua7ut3BeS1jv4+zFuD2oPF8k5l75Rwe1B4vknMv8Aym0bqa7ut3BOS9jv4+zFuD+oPF8k5l75Rwe1B4tknMvfKbQGu7rdwXktY7+Psxfg/qDxbJOZe+UcHtQeL5JzL3ym07oa7ut3A5L2G/j7MX4Pag8WyTmXvlHB7UHi+Scy98ptBua7ut3A5LWG/j7MX4Pag8XyTmXvlHB/UHi2Scy98ptG4a7ut3A5L2G/j7MX4Pag8WyTmXvlHB/UHi2Scy98ptBua7ut3A5L2G/ixfg/qDxbJOZe+UcH9QeLZJzL3ym0L6jXd1u4HJew38WLcH9QeLZJzL3yjg9qDxbJOZe+U2gNd3W7gcl7DfxYvwe1B4tknMvfKOD2oPF8k5l75Tadzc13dbuByWsN/H2cngNg5uAAAAAAAAAAAAAAAAOsZcnOsGczg7Px9G1zP7b8f2AGbbVAAAAUQUUQBQABPaoAm4AAC+sTcAABRAFEUAAAAAAAQBQAAEEAUAEABQAAAQAFABFFQEABQAHKADo7igAAAAAAAAAAAAAAAA6wcnusGbzg7Px9G1zP7b8f2EVGcbUAAAUAAAAAAFQARQAEAVAFEAURQIAQUQUUBAAUQVAAABUQAFEURBUAFRQEUQBQAgBQARQAAAHKADo7igAAAAAAAAAAAAAAAA6vcoOsGczg7Px9G1zP7b8f2EVGbbUAAEVQAAAAAAEUAEAAAAAAAAAABRFAAANwAAAAAmUUAQkFAUBAQAFAABUERQFUAQAAAAcoAOjuKAAAAAAAAAAAAAAAADrBye6wZzODs/H0bXM/tvx/YlA9bONoAIoAoigAAAAAACAAAAAAAAB6wAABUAAAUQBQEBFFEAQ0m4SKACAAAAGlFBQDYAUEAABFBRAByiA6O4oAAAAAAAAAAAAAAAAOr3KDq/2M5nB2fj6Nrmf234/sBIzjagCAAoAAAABIAioCggASAAAHrAAAAAXQAAAgKqQCKIoAAIKAgAAAAAKgIACgqKAAAAAIqKAA5QAdHcUAAAAAAAAAAAAAAAAHWDk91gzmcHZ+Po2uZ/bfj+wiyjONoAoqBIABAAAgAAAKIAHWAAAAAAAKAqIA/pYtXL92mzaoqruVzFNNNMbzMz6lJnR0v5D9fVGS3MhxVjA4iuKsXNmm5fpjstzV1xT+O20+1+QtdM0VfDV0v4w8SnEoiuidMSAI/sBUABQAABABQEAABUEFRQBUAAABQARQAHKADo7igAAAAAAAAAAAAAAAA6wcnur2czg7Px9G1zP7b8f2VFRnG1AAAAAAAAFEEEUFAAQAURQAQAUAFRUBsHQjpSinDxqPMLUTXXH/AItNUdkfz/BnmhcjnUGpcLl8xP0Mz6d+Y9VEdvv7Pa6Kx9NGCyXE/q9MW6LOHq9CmmNoiIp6oe5ke0iuZx6+ino+7KZzZRnDpi0w556un7e7nDWWPqzLU+Y4yqqZ+kv1bfhE7R+UPx5fK7VNdyque2ZmXxeNXVNdU1T1tPhYcYdEUR0RGhAH8PoKgqaBUVAEFAVAUEBUFAAQRUFFEEFAAAAEUUABygA6O4oAAAAAAAAAAAAAAAAOr3KDrBnM4Oz8fRtcz+2/H9hFGcbRAIFABAAUVFEQAUABFAEFQAAUAQ0gPlTTNU7R2gg+zm2AxOVXLVrG0fRXblqLvoT200z2b/ZPrfUpriexaommdElExXT8VPPDYugDLqacDj80rp+vcrizRM/ZHXP5tJzqia8nxtEdc1YeuI/4y8x0N2IsaDwlUR13Kq659svYV0xXRVRPZMTEtxYYUU2lNP1j+3Kcr484mUMSueqdHDmcn1xtXVH2Ts+L7ud4arB5xjMLXG1Vq/XRPsmX0mHqj4Z0S6pRVFVMVR1gCP6Efdqy3E0ZVGZ3KPQw9dz6O3M/xztvO34f3fTf1MTHS/mK6auiQEfyqoKoAAAAAAAAiggAAEKAkgCgABAA5QAdHcUAAAAAAAAAAAAAAAAHWDk91gzmcHZ+Po2uZ/bfj+wAzjagAiBIKAAAAAAAAAAgAaFEEBUFVXvOhzTH+L53/imLt+lgsHMTFMx1V3PVH4R2vBT1Q6O6MMujLtE4C16O1d2j6auftmrr/ps9PJNtGPcf5dFPO8HOO+qtbSYo6aub/bDOkjH/AOK63za76reIqs0/hR9X+z8Kzbmntfq6owleF1ZnFFz96Mden31zL8y7cil5+PMzi1TV06Ze1aRTTgUU0dERH9OieiiumrQWXRTO/oxVE/jvL1dLOegLHxitJ3sLM/Ww2Iqjb7quuGjxDcWFfx21Ex9IcpyvhThX2LTO1PnzsB6Z8snL9a3r1NO1vGURfp/Hsq/ON/a8S3Dp3ymcZpuzmduje5gbn1v/ANdXVP5+j+bD4ZPKmB8m5q+k8/H3dCyBc/ybGiZ6aeafD20D9bSOR3tRZ9YyuzvTFc73K/5aI7Zfkw2D9H3Kopw2YZ1XH1q64w9v7oiIqq98zHufKwt/5GPTRPR1vvla8mztK8Wnp6I+8/8AaX4fTVFrL8VlORYWiLeFwuFmaaY+2Z23/JnezS+n+z6OosHemOqvDbe6qWaP7ylGi6rh8sic9hhz9Y89POiiPxPVUAAAABAAUAAAAFQQVABQJBABRUUHJ4Do7igAAAAAAAAAAAAAAAA6wcnusWczg7Px9G1zP7b8f2QBm20EUUQVAABQFBAAAAAAQAAVAA6xFIj0qoj7Zh1Zklum1k+Cop7KcPREf8Ycq0ztVE/Y6d0hj6MdpXLcVRVE+lh6Yn8Yjaf6NBkCY+OuOvRDHZ30z8vCq6tMsU6asLGA1viq4jaMVRTep920/nEvBRvXU2bp/wAmrxOX4TOLVMzVh6/o7m38tXZ+bI7Fr0I3mOt5mU8GcK6qj68/F7+QbqnGyfhz1xGifDm/po/QDjacHn+Jy6uraMXa9KmP9VP/ANb+5tsuWMnzi7k2c4TMbO81Ye7FcxHrj1x7Y3h1DgsRaxmDs4uxVFVq9RFdFUeuJjeHvZCx4qwZw56Y/qWRzstKsO5px+quPOPbQ/nmuCtZjlmJwN+N6L9uqifbDl/NsHdy7McRgr0TFyxcmid/ul1Uw3pzyecJqW1mVuja1jLf1v8AfT2/ls/nLuB8WFGLHV/UrmpefLx6sCeirnj7x7M+iN3QHQlTTToKxMbbzfuTV+O7AI2jtbJ0B5tTiMix+Wb/AF8NiIuR/trj40y8zIlUU3WieuJe9nRh1V2EzHRExM/16v4fpCYaqvC5ZjqY+rRXVaqn8Y3j+ksgh0nr/JP8d0njsJTTvei39JZ+306euI9vZ7XN1VM0ztMbP6y1gzRcfH1VQ/jNe5jFs/l9dM+U88er47I+Uo8dowBQBAURUAAABQAABQAEBFFEFENIAK5PAdHcUAAAAAAAAAAAAAAAAHWLk51izmcHZ+Po2uZ/bfj+yAM42gAgICgQAqoAAAHsAAABAA0ACACKqtj6Bc2nEZVisnuVb14ev06I/wBNX/2xz1vU9FubRk2scJfrq9Gzen6G79m1XZPsnZ+zJ2P8i4pqno6J8Xl5btf5VlXREc8c8feG/wCd5XazTJsVl96mJi9bmmN/VPqn3uX82t14LGXsJdj0blquaKon1TEusKqvRc6dNmWzgdc3L9NO1vG24vU/Z6XZV+cb+17WXsCJw6cWOrmZnNC50Y9eBM80xpj7x7f08VNM1y6B6D83/XtI05dcr3vYCr6Prntonrp/vHsYJap27XtuiHOpyrV9mzXVtZxkfQ1fZv6vzeRku4+RcUzPRPNxaTOG0/lWVUR0088eHs6BeQ6XsqpzHReJvRTvdwcxfp/CP3vymZ9j17+OPsUYrAYjCXI3ovWqrdUfdMbS2OPhRi4VVE9cOZWmPNvj0YsdUxLk3EXN52h7LoQx84DW9u3XVtZxtubFXX6+2n8429rxt7DXLGMvYa7+/ZuVW6vxidpfdwF+vB4i1iLU+jXaqiumfviWDwMWcHFpr+kuvXuDTcW1eDtR/wDjq+I2jZzd0n5VGT6xxmGoo9Gzdn6a19m1XXt7J3b3pzN7WdZDhMxszE/TW4mqI9VXrj3s+6esq+ly7CZxRT9azX9FXP8Apq7PzarK+FGPa/Mp6ufwc9zdx6rW/wDk183xaYn79X+vFjwDIOjgIqKCAoggoiqCwm5uBIALAioACgAgIooigiuTwHR3FAAAAAAAAAAAAAAAAB1j63JzrFnM4Oz8fRtcz+2/H9kkJGbbQAUQJBRABQAAQAUBABQAQAkVAEF9axV6M7xKJPYK6S6P87qz7SeBxtyuKr0UfR3v99PVM+3t9ryHT/l9FeW5XmMxHp271drf7qqd/wD1P0d7815bmeDqn6tu9Tcpj/dG0/0h9z9IK/TRpvL8P/FXi/SiPupoqif+0NZi4vzsmfHV9POJc8wMD+Ll2MPD6PinhMaf6lifY+Vi5XYxFu/bnau3VFdM/ZMTvD4doycOh9LqfIcbRmWSYPH0TvF+zTX74fc7XhuhHHzjNE02Kqt6sJfrtezqqj/s91Ha6Ba4vzcGmv6w49fYH8e5rwvpMua+kLDUYXW+b26Y2j9Zqr/5bVf3eeuVTts9J0m3abuvM3mmd9r/AKPupiP7PNTG7CXOiMavR9Z/t1iwmZtsOZ2Y/prn6PeaVXcLj8muVbzZqi9bif5Z6p/P+r3PSRhKcTofM7cxvNNr04+6YmJZD0J4j9V11hqN9oxFuu1Pu9KP+rZukC7TY0ZmtdU7R+r1R7+ppsn4nzMn1RV1RMeTDZawfk5Ypqo/+ppnx06P7hzLPVKIMo6CAKAAgAKAIgAoKgCgAQqCCoCgqKgCArlAB0dxQAAAAAAAAAAAAAAAAdYOT3WDOZwdn4+jaZn9t+P7ADONqAkgIqCiooAAAICoAaAADcEBUVBQBCFEXfYVq36PVcxjc1pjsi3RM+9+b07ZvRjtTWcBar9K3gbU01RHZ6dXXP5RD+vRzm2H0vonM86u7TicVd+hw1ue2qaY7fw3n8mc4nEX8ViruJxFc3Lt2ua66p9czL1se5+CxowI6Z55+2nmZ21spxcq4t3PRTzR99ERPDofFJ7AeQ0bXf0db8zZzrDTPVTXariPxiqJ/pDWblUUW6q6p2imJmZ+yGQ/o8W6orzq5tPo/wCTH/d7DpXz2nJ9IYmimvbEYuJsWuvr6/3p9kbtjk7FjCsIrq6tP9y5plm3m4yvVhUdNU0/1DAs7xc5hnWNx0//AJGIrueyapmH1SpN9mPqmapmZdJopiimKY6Ieh6OK66deZNFG+84mI6vs2ndqXTlm9GE01RltNf+bi643jf+GOuf7M86If1ajVU5njblNvDZdYrv111dkTt6Mf1l+brzUF7Umob2Pq9KmzH1LFuf4aI/vPa9XBuPkWNVPXVPl1s/c2f8vK1Fcx/jhxEz99MzEer8KUB5TQAAgAqgCIAKAEgAAKkKgAKEKioIAAAK5QAdHcUAAAAAAAAAAAAAAAAHWDk91gzmcHZ+Po2uZ/bfj+wAzjaIAKIqAogAoAgoCAAACiKbAIqAAvUKhKyIP6V371dm1ZrrmbdqJiin1U7zvP8AV/P2GykzpIiI6ESrq61WKZrmKaY3mZ2iEVtnQHYps6RxmNu7URexMz6U/wAtNMR/X0me9KOoZ1BqOuqxXM4LDb27Eeqftq9r9DVOpKct0zg9JZJd2t27URjL9E/v1T11Ux92/bLw2+8db1by7iMCi2o6I6fuz+TsnzN1iX2JHPVM/DH0jo0+MeT4wSso8p7752r123ZuWaK5pt3Jia4j+Lbs3fDtBdKaIgPWAACgKiIAKoKCIAAAAACgoIAAAAAg5QAdHcVAAAAAAAAAAAAAAAAHWDk91gzmcHZ+Po2mZ/bfj+wAzjaoKgAIKKgCiKAD3HRlorA6swmMu4rG4jD14e5TTEW4p2mJj74fXAwa8euKKOmX57u6w7XCnFxZ5oeHG0cHcn8Wx/uo+CcHco8Xx/uo+D9+prrZ84eRylyftTwli42jg5lHi+P91HwODmUeLY/3UfBNTXez5wvKbJ+1PCWLjaODuUeLY/8A40fA4O5R4tj/AHUfBdTXez5wcpsn7U8JYuNo4O5R4vj/AHUfBeDuUeLY/wB1HwNTXez5wcpsn7U8JYsNo4O5R4tj/dR8Dg7lHi+P91HwNTXf084OU2T9qeEsXVs/B3KPFsf7qPgcHMo8Wx/uo+Camu9nzg5TZP2p4SxgbPwdyjxbH+6j4HB3KPFsf7qPguprvZ84OU2T9qeEsYI6mzx0O5T4vj/+NHwXg7lHi2P91HwTU139POF5TZP2p4SxmZ3h8W0cHco8Wx//ABo+CcHco8Wx/uo+Bqa7+nnCcpsn7U8JYwjaODuUeL4/3UfBeDmUeL4/3UfA1NdbPnBymyftTwli42fg7lHi2P8AdR8F4O5R4tj/AHUfA1Nd/Tzg5TZP2p4SxdG08Hco8Xx/uo+BHQ7lHi2P91HwXU13s+cHKbJ+1PCWLjaODuUeLY/3UfA4O5R4tj/dR8DU139PODlNk/anhLF0bTwdyfxbH+6j4HB3J/Fsf7qPgamu/p5wcpsn7U8JYsraODuT+LY/3UfAnodyfxbH+6j4Gprv6ecJylyftTwli6No4PZP4tj/AHUfBeDuT+LY/wB1HwNTXX084OUuT9qeEsWG08Hcn8Wx/uo+DyHSbonL9KYLCXsLjcTfuX7k0+jdinaIiPuh8sbJlxg0TXXHNG997bLtnc4sYWHVOmd0vChA/A9gABTcAAAAQFABygA6M4qAAAAAAAAAAAAAAAAOsHJ7rBnM4Oz8fRtcz+2/H9gBnG0QAEAkUEWAUBAat+j5iIpxOaYTfrqpouRH4Tsyl7LoczCMDrfD26p2pxNFVqfx23j+j92TsT5dzRM/X++Z5eWsGcaxxKY+mnhzughYhW5cpRJUBNjZVBEfJATrNlhdgRHyQE6zrXYBFVAQ61g2BB8kBBdjYE6x8tkkEFmDYEF2ARFARTYAZB+kHfirF5ZhYnrpoqrmPxnZrzn7pix/67rfE26at6cNTTaj8dt5/q8nLWJ8Fto+sx/toc2MGa76KtmJn09XjBUY90kCQAFAABBQAAHKADozioAAAAAAAAAAAAAAAA6wcnusGczg7Px9G1zP7b8f2ARnG0AAEkQUUAUAB9nKsVXgM0wuOt7+lYu03I9k7vrHYRMxOmEqpiqJpnol1jg79vE4OzibVXpUXbdNdM/bExu/q8P0LZzGZ6Ot4Wure/gK5s1Rv1+j20z7ur2PcOgW+NGNhU4kdcOP3lvVbY9eDPVIEK+z8yAgKEAAAAAAAEpCgAACCwAAAgsAAACSoJsbKkgIAP5Yu/bw2EvYm7VFNFqia6pn1REbuWs2xdePzTFY65+9fu1XJ9s7tz6ac4jLNH14W3Vtfx9cWaY9fo9tU+7q9rA92Wy9j/FiU4UdXq3madrNGDXjz/8AU6I+0e/9IA8FrkFQABRQAAEAAHKADo7ioAAAAAAAAAAAAAAAA6wcnusGczg7Px9G1zP7b8f2AGcbREUFQAARQFSFAAFe06Hc8/wfVdFi7X6OGxsfRV7z1RV/DPv/AKugXJdFVVFcV0TNNVM7xMeqXR/RvqCnUOmLGIqqj9ZtR9Ffj1xVHr9va0mQrrTE4E/ePVh867DRVTdUx080+k+j0xKDRMYAoAIAQKACAAAsdgEgkgAKJIEyAAqKCAAKgBIgADzPSTn9On9MX71FURir0fRWKfX6U+v2R1vni4lOFRNdXRD64GBXj4tOFR0zOhknTBnn+MaruWrVfpYbBx9Db27Jn+Kff/R4x8q6qq6prqmZqmd5mfXL4sDj4s42JOJV0y67a29Ntg04VPREAI+b9AEgBAoAAACAADlAB0dxUAAAAAAAAAAAAAAAAdYOT3WDOZwdn4+jaZn9t+P7ADNtqgooiSqSKBAAKgKAA9V0Zanq01qCmu9VP6jidreIj7I9VXs/pu8qkv7wsWrCriunph8rjAouMKrCxI5pdaW66Llum5bqiqiqImmqJ3iYn1vky3oV1dF+xTp3Mbv+bbj/AMWuqf3qf5fY1NurW5pucKMSlya/ssSyx5wq+ro3x9QE3fpfjVNlAAAEUBFQACUBYBNwXdOsAUQBZlNwAVBBUBQBQfC7XRatV3blcUUURNVVU9UREetzt0k6mr1Ln9d21MxgrG9vD0/bHrq/Gfg9x00aui1aq07l1369cf8AlV0z2R/L8WPsvlm++Or5FE80dP3bzNnJXyqf5WJHPPR9vr4/19xFR4DWiKiqAoAiogAoAAAIrlAB0dxUAAAAAAAAAAAAAAAAdYOT3WDOZwdn4+ja5n9t+P7ADONoACoGwCBIAoAAAIoivnYvXcPfov2LlVu5bqiqiumdpiY9bfejLW1nUuAjCYuqm3mlmna5T2Rdj+en+8Ofn98uxeJy/G2sZhL1Vm9aq9Kiqmex+2xva7TE0xzxPTDy8q5Lw8oYXwzzVR0T/wB1Orx5Ho61rhNTYSMPeqos5lbp/wAy1M/vx/NT9v8AZ6717Nrg41GNRFdE6Yly+5tsS2xJwsWNEwog+r4AEQAokgAAgoCbosgEBsSAIoAbACbqAAAPFdJutbOnMDODwdVNzNL1O1EdsWon+Of7Q/t0i60wumsJOGsVU3syuU/UtxO/oR/NV9n4etgWPxeIx2Mu4vF3art67V6VdVU9cvEyplP5MThYU/5f17tRkHIc3Mxj48f4R0R9fb+387925fu13r1dVy5XVNVVVU7zMz2y+AMn0ug6IjmhJBFUAAAAVAFABFEQUAHKADo7ioAAAAAAAAAAAAAAAA6xlyc6xZzODs/H0bXM/tvx/ZAGcbQAARUFAAABABFEVAFQFf1wuIxGExNvE4W9XZvWqvSoronaaZbX0c9I+Hzem3ludV0YfHfu03Oyi78JYetM7TvHVL9dneYlrX8VPR1w87KOTMHKGH8OJHP1T1x/30dajDdDdJuNyiLeBzr08Zgo2im523LUf+0fd2tkybNsvzjB04vLcVbxFqqO2meuPumPU19pf4V1H+M8/wBHOMo5JuLCr/0jTT1THR7PviK/a8wRQAABBQTZQETZF3ARQAQBQH0c6zfLsmwlWKzHFW7Fqn+aeufwj1pVVFMaZnmf1RRVXVFNMaZl97ZnXSL0jWMqi5luTV0X8d2V3Y66LXxl5XXXSbjM2prwOS+ng8FPVVc7Ll2P/WPzZ3VO87z1zLOZQyxzTRgcf9NnkjNrRMYt3H2p/wB/64v64rFX8XibmJxN2u7euVelXXVO81T9r+SG7OaZnpbSIiI0QqG4AAoIqIoCqAAIKIAIAKgOUQHR3FQAAAAAAAAAAAAAAAB1jLk51izmcHZ+Po2uZ/bfj+yAM22gAogAoIoBsEABICACgAgAKTD9DIM4zHI8ZGLy3FXLFe/XET9Wr7pj1voBTVNM/FTOiX810U4lM01RpiW06Y6Wcvv002c+szhK+z6e3E1UT+Mdsfm0PL8dg8xwtOKwGKtYmxX+7ct1RVE+5yjVG8bN76CrP0eg6atv38Tcn+kf2abJOUcbHxPlYnPzdPWw+cORba0wfn4OmOfRo6nvF3RGgY5dxAFhXxAXcQEUQFAAH1czzDBZZhasVmGKtYaxT213Ktofah4Xp0w302g67m282cTbr98+j/d8LnFnCwqq4jTMQ/VY4FNxcUYVU6IqmIfmao6WMFat1WcgsziK56vp7tM00x+Eds+1k2eZrmGc4yrFZjirl+uez0p6qfwj1PoUztGz5SxdzfY1zP8AnPN9Op0+xyVbWMf+VPP9Z6f++z4qD8b0QQlQBQBAFQAFRQQVABUQFAAAHKADo7ioAAAAAAAAAAAAAAAA6xcnOsWczg7Px9G1zP7b8f2QkGcbQABBUkBFAAAAAQX2gICiosAgAKpDT+iTXOXZPga8lzav6C1Nyblm9tvTG/bTP2djMB97a5rtsSMSjpfjvrLCvcGcLF6HS0ax0vMbxnmC5kL+2GmPHMFzYc07m71tf42zHmz3JG37yfJ0t+1+l/G8FzIX9r9MeOYLmQ5o3N01/jbMJyRt+8nydL/thpjxzBcyE/bDS/jmC5kOaSF19i7MHJG37yfJ0t+2Gl/HMFzIP2w0v45guZDmk3NfYuzByRt+8nydLfthpfxzBcyD9sNL+OYLmQ5p3DX+LswckbfvJ8nS37YaX8cwXMg/bDS/jmC5kOaV3TX+Lsx5nJG37yfJ0pOsdL7f/OYLmQ8B0r65yrM8o/wTKrv6z6ddNV67TH1YiJ3iI+3r29zKd0fG4yzjY2HNGiI0v1WebVtbYsYvxTMxzx91ntRR5DRIAogoAKgILAAAAiiKACACgCggCK5QAdHcVAAAAAAAAAAAAAAAAHWDk91gzmcHZ+Po2uZ/bfj+wAzjaAAEgAIqAHrAVUVBAAVFEBQAFQAAAhUVAEUABUEVAFhBFUEA9YLCoIAAAoAIAeoFQAABSAAAAABAAUURBygA6O4qAAAAAAAAAAAAAAAAOsXJzrFnM4Oz8fRtMz+2/H9kFRnG1AAAAQUARQEAAAABQTYUBAUVAAAWAABAAABDSgoogKAACCwAhKoEAAKigIKAgAAAKACCgoAgIoDk8B0dxUAAAAAAAAAAAAAAAAdYuTnWDN5wdn4+jaZn9t+P7KIM42oAoAACAAECqISIAAoigIAKAAgAKgKoiiAAAICiKAIBoFRQEVAAUEAAVIWAAQCQAIVF9YCKAAIAAoADk8B0dxUAAAAAAAAAAAAAAAAdYuTnWDOZwdn4+ja5n9t+P7KijNtogqKAEggqCgoIgAoKggqKAAAAAAGlBQEUAAAQUBCQAUAAAQUAEAFAAABFAQVACBRQBEAAB6nSGS/TWb2JxVExRctzboiY6+vtl+BmWCv4DF14e/TMTTPVPqqj7YfWrBqpoiueiXwouaK8ScOJ54fVAl8X6HJ4DpDioAAAAAAAAAAAAAAAA6wcnusWbzg7Px9G0zP7b8f2AGcbQAFQBQAASVBUFQFQAFAQAAAAAAAFABABFAARYAABUAAAEABQAABQQUkERRAAFABB+nkeKy7DYiKsfhKr0b9VUVfu/wD8+t+aP6pqmmdMP5roiun4ZarhL1jEYei7hq6a7Ux9Waex+NqrH5Vatfq+Lsxib228UU9U0/fv6nndM5zOWxiKLkzNuq3NVFP+v1e9+Pfu3L96u9dqmquud6pn1y/fiXkThxERzy8jAybNONM1TzR0b0uzRNyqaKfQpmeqnffaPxRFec9mHJwDo7iwAAAAAAAAAAAAAAAA6xcnNv4u6b7lm3Kt+d4WWrbFx/g+XTp0afRq82L3Atfm/OqinT8OjzaEM94u6b7jm3Kt+c4u6b7jm3Kt+d4WrbrYlqtdWHew0IZ7xd033HNuVb85xd033LNuVb866uutiTXVh3sNCGe8XNN9xzblW/OcXNN9yzblW/OauutiTXVh3sNBGe8XNN9yzblW/OcXNN9yzblW/OauutiV11Yd7DQhnvFzTfcs25VvznFzTfcs25VvzmrrrYk11Yd7DQhnvFzTfcs25VvznFzTfcs25VvzmrrrYk11Yd7DQhnvFzTfcc25VvznFzTfcs25VvzmrrrYk11Yd7DQhnvFzTfcs25VvznFzTfcs25VvzmrrrYk11Yd7DQlZ5xc033LNuVb85xc033LNuVb85q662JNdWHew0NGe8XNN9yzblW/OcXNN9yzblW/OauutiTXVh3sNCGe8XNN9yzblW/OcXNN9yzblW/OauutiTXVh3sNDRnvFzTfcs25VvznFzTfcs25VvzmrrrYk11Yd7DQlZ5xc033LNuVb85xd033LNuVb86auutiTXVh3sNDJZ7xd033HNuVb85xd033HNuVb866uutiTXVh3sNBGe8XNN9yzblW/OcXNN9xzblW/OmrrrYk11Yd7DQhnvFzTfcs25VvznFzTfcs25VvzmrbrYk11Yd7DQhnvFzTfcs25VvznFzTfcs25Vvzrq262JNdWHew0IZ7xc033HNuVb85xc033LNuVb85q662JTXVh3sNCGe8XNN9xzblW/OcXNN9yzblW/OauutiTXVh3sNCVnnFzTfcs25VvznFzTfcs25VvzmrbrYk11Yd7DQxnnFzTfcs25VvznFzTfcc25VvzmrrrYk11Yd7DQxnvF3Tfcs25Vvzpxc033LNuVb85q662JNdWHew0MZ5xd033LNuVb85xc033LNuVb85q662JXXVh3sNCGe8XNN9yzblW/OcXNN9xzblW/OmrbrYk11Yd7DQhnvFzTfcs25VvznFzTfcs25VvzmrbrYk11Yd7DQxnnFzTfcc25VvznFzTfcc25VvzmrbrYk11Yd7DQhnvFzTfcs25VvznFzTfcs25Vvzrq662JNdWHew0JWecXNN9xzblW/OcXNN9xzblW/OmrbrYk11Yd7DQyWecXNN9yzblW/OcXNN9yzblW/OauutiTXVh3sMRAbpykAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//2Q==`;

// ── Inline styles object (avoids CSS-in-JS lib dependency) ───────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

:root{
  --or:#FF7A33;--or-d:#FF5500;--or-f:#FF7A3311;
  --bg:#0D0D0D;--bg2:#141414;--bg3:#1A1A1A;
  --glass:rgba(255,255,255,.04);--glass-b:rgba(255,255,255,.08);
  --border:rgba(255,255,255,.08);--bor-o:rgba(255,122,51,.3);
  --text:#F5F0EB;--text2:#B0A898;--text3:#6B6259;
  --rad:18px;--sh:0 24px 64px rgba(0,0,0,.6);
  --sho:0 8px 40px rgba(255,122,51,.25);
  --tr:.35s cubic-bezier(.4,0,.2,1);
}
.lp-root *,
.lp-root *::before,
.lp-root *::after{box-sizing:border-box;margin:0;padding:0}
.lp-root{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
.lp-root img{display:block;max-width:100%}
.lp-root a{text-decoration:none;color:inherit;cursor:pointer}
.lp-root ul{list-style:none}
.lp-root button{cursor:pointer;border:none;outline:none;font-family:inherit}
.lp-root::-webkit-scrollbar{width:5px}
.lp-root::-webkit-scrollbar-track{background:var(--bg)}
.lp-root::-webkit-scrollbar-thumb{background:var(--or-d);border-radius:99px}

/* Utilities */
.lp-container{max-width:1200px;margin:0 auto;padding:0 24px}
.lp-tag{display:inline-flex;align-items:center;gap:8px;font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--or);background:var(--or-f);border:1px solid var(--bor-o);border-radius:99px;padding:6px 14px;margin-bottom:16px}
.lp-tag::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--or)}
.lp-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);font-weight:700;line-height:1.15;color:var(--text);margin-bottom:16px}
.lp-sub{font-size:1.05rem;color:var(--text2);max-width:520px;line-height:1.7}
.lp-accent{color:var(--or);font-style:italic}
.lp-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--or),var(--or-d));color:#fff;font-weight:700;font-size:.95rem;padding:14px 28px;border-radius:99px;box-shadow:0 8px 32px rgba(255,122,51,.4);transition:var(--tr);position:relative;overflow:hidden;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
.lp-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent);opacity:0;transition:var(--tr)}
.lp-btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 12px 40px rgba(255,122,51,.55)}
.lp-btn:hover::after{opacity:1}
.lp-ghost{display:inline-flex;align-items:center;gap:8px;background:var(--glass);color:var(--text);font-weight:600;font-size:.95rem;padding:14px 28px;border-radius:99px;border:1px solid var(--border);backdrop-filter:blur(12px);transition:var(--tr);cursor:pointer;font-family:'DM Sans',sans-serif}
.lp-ghost:hover{background:var(--glass-b);border-color:var(--bor-o);color:var(--or);transform:translateY(-2px)}
.lp-reveal{opacity:0;transform:translateY(36px);transition:opacity .7s ease,transform .7s ease}
.lp-reveal.vis{opacity:1;transform:translateY(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
.d4{transition-delay:.4s}.d5{transition-delay:.5s}

/* Navbar */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 24px;transition:all .4s ease}
.lp-nav.scrolled{background:rgba(13,13,13,.93);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);box-shadow:0 4px 24px rgba(0,0,0,.4)}
.lp-nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:72px}
.lp-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
.lp-logo-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--or),var(--or-d));display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 4px 16px rgba(255,122,51,.4);flex-shrink:0;overflow:hidden}
.lp-logo-text{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--text);line-height:1.1}
.lp-logo-sub{font-size:.65rem;color:var(--or);letter-spacing:.08em;text-transform:uppercase}
.lp-nav-links{display:flex;align-items:center;gap:2px}
.lp-nav-links a{font-size:.9rem;font-weight:500;color:var(--text2);padding:8px 14px;border-radius:8px;transition:var(--tr)}
.lp-nav-links a:hover,.lp-nav-links a.active{color:var(--text);background:var(--glass)}
.lp-nav-links a.active{color:var(--or)}
.lp-nav-actions{display:flex;align-items:center;gap:10px}
.lp-nav-login{font-size:.9rem;font-weight:600;color:var(--text2);padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:transparent;transition:var(--tr);cursor:pointer;font-family:'DM Sans',sans-serif}
.lp-nav-login:hover{color:var(--text);border-color:var(--bor-o);background:var(--glass)}
.lp-nav-signup{font-size:.9rem;font-weight:700;color:#fff;padding:9px 20px;border-radius:99px;background:linear-gradient(135deg,var(--or),var(--or-d));box-shadow:0 4px 16px rgba(255,122,51,.3);transition:var(--tr);cursor:pointer;font-family:'DM Sans',sans-serif}
.lp-nav-signup:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(255,122,51,.45)}
.lp-hamburger{display:none;flex-direction:column;gap:5px;padding:8px;background:transparent;border:none;cursor:pointer}
.lp-hamburger span{display:block;width:22px;height:2px;background:var(--text);border-radius:2px;transition:var(--tr)}
.lp-mobile-menu{display:none;position:fixed;top:72px;left:0;right:0;background:rgba(13,13,13,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:16px 24px 24px;z-index:999;flex-direction:column;gap:4px}
.lp-mobile-menu.open{display:flex}
.lp-mobile-menu a{font-size:1rem;font-weight:500;color:var(--text2);padding:12px 16px;border-radius:10px;transition:var(--tr)}
.lp-mobile-menu a:hover{color:var(--or);background:var(--or-f)}
.lp-mob-actions{display:flex;gap:10px;margin-top:8px}
.lp-mob-actions .lp-nav-login,.lp-mob-actions .lp-nav-signup{flex:1;text-align:center}

/* Hero */
.lp-hero{min-height:100vh;position:relative;display:flex;align-items:center;overflow:hidden}
.lp-hero-bg{position:absolute;inset:0;background-image:url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1800&q=85&auto=format&fit=crop');background-size:cover;background-position:center;filter:brightness(.3) saturate(.7)}
.lp-hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(13,13,13,.96) 0%,rgba(13,13,13,.65) 40%,rgba(255,85,0,.06) 70%,rgba(13,13,13,.85) 100%)}
.lp-blob{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
.lp-blob-1{width:500px;height:500px;background:radial-gradient(circle,rgba(255,122,51,.13),transparent 70%);top:-100px;right:-100px;animation:blobFloat 8s ease-in-out infinite}
.lp-blob-2{width:300px;height:300px;background:radial-gradient(circle,rgba(255,85,0,.09),transparent 70%);bottom:100px;left:-50px;animation:blobFloat 10s ease-in-out infinite reverse}
@keyframes blobFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.05)}}
.lp-hero-content{position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:120px 24px 60px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.lp-hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,122,51,.12);border:1px solid rgba(255,122,51,.3);border-radius:99px;padding:7px 16px;margin-bottom:28px;font-size:.8rem;font-weight:700;color:var(--or);letter-spacing:.1em;text-transform:uppercase;animation:fsu .8s ease forwards}
.lp-hero-badge span{width:6px;height:6px;border-radius:50%;background:var(--or);animation:pulse 1.5s ease infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
.lp-hero-title{font-family:'Playfair Display',serif;font-size:clamp(2.8rem,5.5vw,4.8rem);font-weight:900;line-height:1.05;color:var(--text);margin-bottom:20px;animation:fsu .8s .15s ease both}
.lp-hero-title em{font-style:italic;color:var(--or)}
.lp-hero-sub{font-size:1.1rem;color:var(--text2);line-height:1.75;max-width:480px;margin-bottom:36px;animation:fsu .8s .25s ease both}
@keyframes fsu{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.lp-hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:40px;animation:fsu .8s .35s ease both}
.lp-loc{display:flex;align-items:center;background:var(--glass);border:1px solid var(--border);border-radius:99px;padding:5px 5px 5px 20px;backdrop-filter:blur(12px);max-width:380px;animation:fsu .8s .45s ease both;transition:border-color .3s}
.lp-loc:focus-within{border-color:var(--bor-o)}
.lp-loc input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:.9rem;font-family:'DM Sans',sans-serif}
.lp-loc input::placeholder{color:var(--text3)}
.lp-loc button{background:linear-gradient(135deg,var(--or),var(--or-d));color:#fff;font-weight:700;font-size:.85rem;padding:10px 20px;border-radius:99px;transition:var(--tr)}
.lp-loc button:hover{box-shadow:0 4px 20px rgba(255,122,51,.4)}
.lp-hero-stats{display:flex;gap:32px;animation:fsu .8s .55s ease both;margin-top:32px}
.lp-stat-val{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:var(--text);line-height:1}
.lp-stat-label{font-size:.8rem;color:var(--text3);margin-top:4px;font-weight:500}
.lp-stat-div{width:1px;background:var(--border);align-self:stretch}
.lp-hero-right{position:relative;height:520px;animation:fsu .8s .3s ease both}
.lp-fc{position:absolute;background:rgba(26,26,26,.93);border:1px solid var(--border);border-radius:18px;padding:16px;backdrop-filter:blur(20px);box-shadow:var(--sh)}
.lp-fc-main{width:300px;top:40px;left:50%;transform:translateX(-50%);animation:fcFloat 6s ease-in-out infinite}
@keyframes fcFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-16px)}}
.lp-fc-main img{width:100%;height:170px;object-fit:cover;border-radius:12px;margin-bottom:14px}
.lp-fc-badge{display:flex;align-items:center;gap:6px;background:rgba(255,122,51,.12);border:1px solid rgba(255,122,51,.2);border-radius:8px;padding:4px 10px;margin-bottom:10px;font-size:.75rem;color:var(--or);font-weight:600}
.lp-fc-rating{display:flex;align-items:center;gap:4px;font-size:.8rem;color:var(--text2);margin-bottom:12px}
.lp-fc-star{color:#FFB347}
.lp-fc-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px}
.lp-fc-row{display:flex;align-items:center;justify-content:space-between}
.lp-fc-price{font-size:1.2rem;font-weight:800;color:var(--or)}
.lp-fc-add{background:linear-gradient(135deg,var(--or),var(--or-d));color:#fff;font-size:.8rem;font-weight:700;padding:8px 16px;border-radius:99px;transition:var(--tr)}
.lp-fc-add:hover{box-shadow:0 4px 16px rgba(255,122,51,.4)}
.lp-fc-sm-1{width:175px;bottom:70px;left:0;animation:fcSm 7s ease-in-out infinite}
.lp-fc-sm-2{width:175px;top:10px;right:-20px;animation:fcSm 9s ease-in-out infinite reverse}
@keyframes fcSm{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-12px) rotate(-2deg)}}
.lp-fc-sm img{width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:10px}
.lp-fc-sm-name{font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:4px}
.lp-fc-sm-price{font-size:.95rem;font-weight:800;color:var(--or)}
.lp-fc-eta{position:absolute;bottom:20px;right:-10px;background:rgba(26,26,26,.95);border:1px solid var(--bor-o);border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:10px;animation:fcSm 5s ease-in-out infinite;box-shadow:0 8px 24px rgba(255,122,51,.2)}
.lp-fc-eta-icon{width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,var(--or),var(--or-d));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.lp-fc-eta-label{font-size:.7rem;color:var(--text3)}
.lp-fc-eta-val{font-size:.9rem;font-weight:700;color:var(--text);line-height:1.2}
.lp-scroll{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text3);font-size:.75rem;font-weight:500;z-index:2;letter-spacing:.08em;text-transform:uppercase;animation:fsu 1s .8s ease both}
.lp-scroll-line{width:1px;height:40px;background:linear-gradient(to bottom,var(--or),transparent);animation:scrollLn 1.5s ease-in-out infinite}
@keyframes scrollLn{0%,100%{opacity:1}50%{opacity:.3}}

/* Restaurants */
.lp-restaurants{padding:100px 0;background:var(--bg2);position:relative;overflow:hidden}
.lp-restaurants::before,.lp-restaurants::after{content:'';position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--bor-o),transparent)}
.lp-restaurants::before{top:-1px}
.lp-restaurants::after{bottom:-1px}
.lp-sec-head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:48px;gap:20px;flex-wrap:wrap}
.lp-rest-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px}
.lp-rc{background:var(--bg3);border:1px solid var(--border);border-radius:var(--rad);overflow:hidden;transition:var(--tr);cursor:pointer}
.lp-rc:hover{border-color:var(--bor-o);transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,122,51,.15)}
.lp-rc-img{position:relative;overflow:hidden;height:180px}
.lp-rc-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.lp-rc:hover .lp-rc-img img{transform:scale(1.06)}
.lp-rc-tag{position:absolute;top:12px;left:12px;background:rgba(13,13,13,.8);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:.72rem;font-weight:700;color:var(--or);text-transform:uppercase;letter-spacing:.05em}
.lp-rc-fav{position:absolute;top:12px;right:12px;background:rgba(13,13,13,.7);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:.9rem;transition:var(--tr);cursor:pointer}
.lp-rc-fav:hover{background:rgba(255,122,51,.2);border-color:var(--bor-o)}
.lp-rc-body{padding:18px}
.lp-rc-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px}
.lp-rc-cuisine{font-size:.8rem;color:var(--text3);margin-bottom:12px}
.lp-rc-meta{display:flex;align-items:center;justify-content:space-between}
.lp-rc-rating{display:flex;align-items:center;gap:5px;font-size:.85rem;font-weight:600;color:var(--text)}
.lp-rc-star{color:#FFB347}
.lp-rc-time{font-size:.8rem;color:var(--text3)}
.lp-rc-footer{margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.lp-rc-from{font-size:.78rem;color:var(--text3)}
.lp-rc-fromval{color:var(--or);font-weight:700}
.lp-rc-order{background:var(--or-f);border:1px solid var(--bor-o);color:var(--or);font-size:.8rem;font-weight:700;padding:8px 16px;border-radius:99px;transition:var(--tr);cursor:pointer;font-family:'DM Sans',sans-serif}
.lp-rc-order:hover{background:linear-gradient(135deg,var(--or),var(--or-d));color:#fff;box-shadow:0 4px 16px rgba(255,122,51,.3)}

/* How it works */
.lp-hiw{padding:100px 0;background:var(--bg);position:relative;overflow:hidden}
.lp-hiw-glow{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(255,122,51,.06) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.lp-hiw-head{text-align:center;margin-bottom:64px}
.lp-hiw-head .lp-sub{margin:0 auto}
.lp-hiw-steps{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center}
.lp-hiw-step{text-align:center;padding:40px 32px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rad);transition:var(--tr);position:relative;overflow:hidden}
.lp-hiw-step::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--or-f),transparent);opacity:0;transition:var(--tr)}
.lp-hiw-step:hover{border-color:var(--bor-o);transform:translateY(-6px);box-shadow:var(--sho)}
.lp-hiw-step:hover::before{opacity:1}
.lp-hiw-num{font-family:'Playfair Display',serif;font-size:3.5rem;font-weight:900;color:rgba(255,122,51,.12);line-height:1;position:absolute;top:12px;right:16px}
.lp-hiw-icon{width:72px;height:72px;border-radius:20px;margin:0 auto 20px;background:linear-gradient(135deg,var(--or),var(--or-d));display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 8px 32px rgba(255,122,51,.35);position:relative;z-index:1}
.lp-hiw-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;color:var(--text);margin-bottom:10px;position:relative;z-index:1}
.lp-hiw-desc{font-size:.88rem;color:var(--text2);line-height:1.7;position:relative;z-index:1}
.lp-hiw-arrow{font-size:1.5rem;color:var(--bor-o);padding:0 8px;flex-shrink:0}

/* Dishes */
.lp-dishes{padding:100px 0;background:var(--bg2);position:relative;overflow:hidden}
.lp-dishes::before{content:'';position:absolute;top:-1px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--bor-o),transparent)}
.lp-filter{display:flex;gap:8px;flex-wrap:wrap}
.lp-filter-btn{font-size:.82rem;font-weight:600;padding:8px 18px;border-radius:99px;background:var(--bg3);border:1px solid var(--border);color:var(--text2);transition:var(--tr);cursor:pointer;font-family:'DM Sans',sans-serif}
.lp-filter-btn.active,.lp-filter-btn:hover{background:var(--or-f);border-color:var(--bor-o);color:var(--or)}
.lp-dishes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px}
.lp-dish{background:var(--bg3);border:1px solid var(--border);border-radius:var(--rad);overflow:hidden;transition:var(--tr);cursor:pointer}
.lp-dish:hover{border-color:var(--bor-o);transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,.5)}
.lp-dish-img{position:relative;height:170px;overflow:hidden}
.lp-dish-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.lp-dish:hover .lp-dish-img img{transform:scale(1.06)}
.lp-dish-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,13,13,.7) 0%,transparent 60%)}
.lp-veg{position:absolute;top:10px;left:10px;width:18px;height:18px;border-radius:4px;display:flex;align-items:center;justify-content:center}
.lp-veg-dot{width:10px;height:10px;border-radius:50%}
.lp-veg.veg{border:2px solid #22c55e}
.lp-veg.veg .lp-veg-dot{background:#22c55e}
.lp-veg.nv{border:2px solid #ef4444}
.lp-veg.nv .lp-veg-dot{background:#ef4444}
.lp-dish-time{position:absolute;bottom:10px;right:10px;background:rgba(13,13,13,.8);backdrop-filter:blur(8px);border-radius:6px;padding:3px 8px;font-size:.72rem;color:var(--text2);font-weight:600}
.lp-dish-body{padding:16px}
.lp-dish-rating{display:flex;align-items:center;gap:4px;font-size:.78rem;color:var(--text3);margin-bottom:8px}
.lp-dish-rating .s{color:#FFB347}
.lp-dish-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--text);margin-bottom:5px}
.lp-dish-desc{font-size:.78rem;color:var(--text3);margin-bottom:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-dish-footer{display:flex;align-items:center;justify-content:space-between}
.lp-dish-price{font-size:1.1rem;font-weight:800;color:var(--or)}
.lp-dish-add{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--or),var(--or-d));display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#fff;font-weight:700;box-shadow:0 4px 12px rgba(255,122,51,.35);transition:var(--tr);cursor:pointer;border:none}
.lp-dish-add:hover{transform:scale(1.1) rotate(90deg);box-shadow:0 6px 20px rgba(255,122,51,.5)}

/* Why */
.lp-why{padding:100px 0;background:var(--bg);overflow:hidden;position:relative}
.lp-why-inner{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.lp-why-left .lp-sub{margin-bottom:36px}
.lp-metrics{display:flex;gap:40px;margin-top:32px}
.lp-metric-val{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;color:var(--or);line-height:1}
.lp-metric-label{font-size:.82rem;color:var(--text3);margin-top:4px}
.lp-why-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.lp-wc{background:var(--bg3);border:1px solid var(--border);border-radius:var(--rad);padding:28px 24px;transition:var(--tr);position:relative;overflow:hidden}
.lp-wc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--or),var(--or-d),transparent);opacity:0;transition:var(--tr)}
.lp-wc:hover{border-color:var(--bor-o);transform:translateY(-4px)}
.lp-wc:hover::before{opacity:1}
.lp-wc-icon{width:52px;height:52px;border-radius:14px;margin-bottom:18px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:linear-gradient(135deg,var(--or-f),transparent);border:1px solid var(--bor-o)}
.lp-wc-title{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--text);margin-bottom:8px}
.lp-wc-desc{font-size:.83rem;color:var(--text2);line-height:1.7}

/* Testimonials */
.lp-testi{padding:100px 0;background:var(--bg2);overflow:hidden;position:relative}
.lp-testi-head{text-align:center;margin-bottom:56px}
.lp-testi-head .lp-sub{margin:0 auto}
.lp-testi-wrap{overflow:hidden}
.lp-testi-track{display:flex;gap:24px;transition:transform .5s cubic-bezier(.4,0,.2,1)}
.lp-testi-card{min-width:360px;max-width:360px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rad);padding:32px;transition:var(--tr)}
.lp-testi-card.active{border-color:var(--bor-o);box-shadow:var(--sho)}
.lp-testi-quote{font-size:2.5rem;color:var(--or);line-height:.8;font-family:'Playfair Display',serif;margin-bottom:16px;opacity:.6}
.lp-testi-text{font-size:.95rem;color:var(--text2);line-height:1.8;margin-bottom:24px;font-style:italic}
.lp-testi-stars{color:#FFB347;font-size:.9rem;letter-spacing:2px;margin-bottom:20px}
.lp-testi-footer{display:flex;align-items:center;gap:14px}
.lp-testi-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid var(--bor-o)}
.lp-testi-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--text)}
.lp-testi-role{font-size:.78rem;color:var(--text3)}
.lp-testi-controls{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:40px}
.lp-testi-btn{width:44px;height:44px;border-radius:50%;background:var(--bg3);border:1px solid var(--border);color:var(--text2);font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:var(--tr);cursor:pointer}
.lp-testi-btn:hover{background:var(--or-f);border-color:var(--bor-o);color:var(--or)}
.lp-testi-dots{display:flex;gap:8px}
.lp-testi-dot{width:8px;height:8px;border-radius:99px;background:var(--border);transition:var(--tr);cursor:pointer}
.lp-testi-dot.active{background:var(--or);width:24px}

/* CTA */
.lp-cta{padding:100px 0;background:var(--bg);overflow:hidden;position:relative}
.lp-cta-inner{background:linear-gradient(135deg,rgba(255,122,51,.12) 0%,rgba(255,85,0,.08) 50%,rgba(255,122,51,.06) 100%);border:1px solid var(--bor-o);border-radius:28px;padding:72px 60px;text-align:center;position:relative;overflow:hidden}
.lp-cta-glow1{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(255,122,51,.2),transparent 70%);top:-150px;left:-100px;pointer-events:none}
.lp-cta-glow2{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(255,85,0,.15),transparent 70%);bottom:-100px;right:-50px;pointer-events:none}
.lp-cta-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;color:var(--text);margin-bottom:16px;position:relative;z-index:1}
.lp-cta-sub{font-size:1.05rem;color:var(--text2);margin-bottom:40px;position:relative;z-index:1}
.lp-cta-actions{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;position:relative;z-index:1}
.lp-trust{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:32px;font-size:.8rem;color:var(--text3);position:relative;z-index:1;flex-wrap:wrap}
.lp-trust-dot{width:4px;height:4px;border-radius:50%;background:var(--text3)}

/* Footer */
.lp-footer{background:var(--bg2);border-top:1px solid var(--border)}
.lp-footer-main{padding:64px 0 40px;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px}
.lp-flogo{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.lp-flogo-icon{width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,var(--or),var(--or-d));display:flex;align-items:center;justify-content:center;font-size:1rem;overflow:hidden}
.lp-flogo-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--text)}
.lp-flogo-sub{font-size:.6rem;color:var(--or);letter-spacing:.1em;text-transform:uppercase}
.lp-fdesc{font-size:.88rem;color:var(--text3);line-height:1.8;margin-bottom:24px;max-width:280px}
.lp-socials{display:flex;gap:10px}
.lp-social{width:38px;height:38px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--text2);transition:var(--tr);cursor:pointer;text-decoration:none}
.lp-social:hover{background:var(--or-f);border-color:var(--bor-o);color:var(--or);transform:translateY(-2px)}
.lp-fcol-title{font-family:'Playfair Display',serif;font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:18px}
.lp-flinks{display:flex;flex-direction:column;gap:10px}
.lp-flinks a{font-size:.85rem;color:var(--text3);transition:var(--tr)}
.lp-flinks a:hover{color:var(--or);padding-left:4px}
.lp-fcontact{display:flex;flex-direction:column;gap:12px}
.lp-fcontact-item{display:flex;align-items:center;gap:10px;font-size:.85rem;color:var(--text3)}
.lp-fcontact-icon{width:30px;height:30px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}
.lp-footer-bottom{border-top:1px solid var(--border);padding:20px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.lp-fcopy{font-size:.82rem;color:var(--text3)}
.lp-fcopy span{color:var(--or)}
.lp-fbottom-links{display:flex;gap:20px}
.lp-fbottom-links a{font-size:.82rem;color:var(--text3);transition:var(--tr)}
.lp-fbottom-links a:hover{color:var(--or)}

/* Cart toast */
.lp-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(120px);background:var(--bg3);border:1px solid var(--bor-o);border-radius:99px;padding:14px 24px;display:flex;align-items:center;gap:12px;font-size:.9rem;font-weight:600;color:var(--text);box-shadow:0 16px 48px rgba(0,0,0,.6);z-index:9999;transition:.4s cubic-bezier(.34,1.56,.64,1);pointer-events:none}
.lp-toast.show{transform:translateX(-50%) translateY(0)}
.lp-toast-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--or),var(--or-d));display:flex;align-items:center;justify-content:center;font-size:.9rem}
/* Cart navbar badge */
.lp-nav-cart{position:relative;background:linear-gradient(135deg,var(--or),var(--or-d));border:none;border-radius:10px;padding:.45rem .7rem;cursor:pointer;font-size:.9rem;display:flex;align-items:center;gap:4px;transition:var(--tr)}
.lp-nav-cart:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(255,122,51,.4)}
.lp-nav-cart-badge{background:#2d1f0e;color:#fff;font-size:.62rem;font-weight:800;border-radius:99px;padding:1px 6px;min-width:18px;text-align:center}

/* Dish qty inline controls */
.lp-dish-add-wrap{display:flex;align-items:center;justify-content:flex-end}
.lp-dish-qty-ctrl{display:flex;align-items:center;gap:6px;background:var(--bg);border:1.5px solid var(--bor-o);border-radius:9px;padding:3px 6px}
.lp-dish-qty-btn{width:26px;height:26px;border:none;border-radius:7px;background:var(--bg2);color:var(--or);font-size:1rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--tr)}
.lp-dish-qty-btn:hover{background:var(--or);color:#fff}
.lp-dish-qty-num{font-size:.88rem;font-weight:800;color:var(--or);min-width:18px;text-align:center}

/* Cart drawer overlay */
.lp-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9998;backdrop-filter:blur(3px)}
.lp-cart-drawer{position:fixed;top:0;right:0;width:0;height:100vh;background:var(--bg2);border-left:1px solid var(--border2);box-shadow:-8px 0 40px rgba(0,0,0,.5);z-index:9999;overflow:hidden;transition:width .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column}
.lp-cart-drawer.open{width:380px}
.lp-cart-header{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px;border-bottom:1px solid var(--border2);flex-shrink:0}
.lp-cart-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px}
.lp-cart-count{background:linear-gradient(135deg,var(--or),var(--or-d));color:#fff;font-size:.7rem;font-weight:800;border-radius:99px;padding:2px 8px;font-family:'DM Sans',sans-serif}
.lp-cart-close{background:none;border:none;color:var(--text3);font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:6px;transition:var(--tr)}
.lp-cart-close:hover{background:var(--bg3);color:var(--text)}
.lp-cart-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center}
.lp-cart-items{flex:1;overflow-y:auto;padding:12px 0}
.lp-ci-row{display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--border)}
.lp-ci-img{width:52px;height:52px;border-radius:10px;object-fit:cover;flex-shrink:0}
.lp-ci-info{flex:1;min-width:0}
.lp-ci-name{font-size:.88rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-ci-price{font-size:.8rem;font-weight:600;color:var(--or);margin-top:2px}
.lp-ci-qty{display:flex;align-items:center;gap:6px;flex-shrink:0}
.lp-ci-qbtn{width:28px;height:28px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text2);font-size:.9rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--tr)}
.lp-ci-qbtn:hover{border-color:var(--or);color:var(--or)}
.lp-ci-qnum{font-size:.88rem;font-weight:800;color:var(--text);min-width:18px;text-align:center}
.lp-cart-footer{padding:16px 20px;border-top:1px solid var(--border2);flex-shrink:0}
.lp-cart-total{display:flex;justify-content:space-between;font-size:1rem;font-weight:800;color:var(--text);margin-bottom:10px}
.lp-cart-login-note{font-size:.75rem;color:var(--text4);text-align:center;margin-bottom:12px;line-height:1.4}
.lp-cart-checkout{width:100%;padding:.85rem;background:linear-gradient(135deg,var(--or),var(--or-d));color:#fff;border:none;border-radius:11px;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(255,107,0,.3);transition:var(--tr)}
.lp-cart-checkout:hover{transform:translateY(-1px);box-shadow:0 7px 22px rgba(255,107,0,.4)}

@media(max-width:480px){
  .lp-cart-drawer.open{width:100vw}
}

/* Responsive */
@media(max-width:1024px){
  .lp-hero-content{grid-template-columns:1fr;padding-top:140px;padding-bottom:80px}
  .lp-hero-right{display:none}
  .lp-hiw-steps{grid-template-columns:1fr;gap:16px}
  .lp-hiw-arrow{display:none}
  .lp-why-inner{grid-template-columns:1fr;gap:48px}
  .lp-footer-main{grid-template-columns:1fr 1fr;gap:36px}
}
@media(max-width:768px){
  .lp-nav-links,.lp-nav-actions{display:none}
  .lp-hamburger{display:flex}
  .lp-hero-title{font-size:2.5rem}
  .lp-hero-stats{gap:20px}
  .lp-why-grid{grid-template-columns:1fr}
  .lp-testi-card{min-width:280px;max-width:280px}
  .lp-cta-inner{padding:48px 28px}
  .lp-footer-main{grid-template-columns:1fr;gap:32px}
  .lp-footer-bottom{flex-direction:column;text-align:center}
}
@media(max-width:480px){
  .lp-hero-actions{flex-direction:column}
  .lp-hero-actions .lp-btn,.lp-hero-actions .lp-ghost{width:100%;justify-content:center}
}
`;

// ── Main component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [dishFilter,  setDishFilter]  = useState('all');
  const [favs,        setFavs]        = useState({});
  const [toast,       setToast]       = useState(null);
  const [testiIdx,    setTestiIdx]    = useState(0);
  const toastTimer  = useRef(null);
  const trackRef    = useRef(null);
  const autoRef     = useRef(null);

  // ── Guest cart — persisted to localStorage key 'annapurna_guest_cart' ──────
  const [guestCart, setGuestCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('annapurna_guest_cart') || '[]'); }
    catch (_) { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);

  // ── Scroll → nav glass effect ──────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Reveal-on-scroll observer ──────────────────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [dishFilter]);   // re-run when filter changes (new nodes may appear)

  // ── Testimonial autoplay ───────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    const len = TESTIMONIALS.length;
    setTestiIdx((idx + len) % len);
  }, []);

  useEffect(() => {
    autoRef.current = setInterval(() => setTestiIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(autoRef.current);
  }, []);

  // Slide track on index change
  useEffect(() => {
    if (!trackRef.current) return;
    const cards  = trackRef.current.querySelectorAll('.lp-testi-card');
    const wrapW  = trackRef.current.parentElement.offsetWidth;
    const cardW  = cards[0]?.offsetWidth + 24 || 384;
    let offset   = testiIdx * cardW - (wrapW / 2 - cardW / 2);
    offset       = Math.max(0, offset);
    trackRef.current.style.transform = `translateX(-${offset}px)`;
  }, [testiIdx]);

  // ── Cart toast ─────────────────────────────────────────────────────────────
  const showToast = (name) => {
    clearTimeout(toastTimer.current);
    setToast(name);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goOrder   = () => navigate('/login');   // redirect to login → user comes back to /menu
  const goMenu    = () => navigate('/menu');
  const goLogin   = () => navigate('/login');
  const goRegister= () => navigate('/register');

  const scrollTo  = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Favourite toggle ───────────────────────────────────────────────────────
  const toggleFav = (i) => setFavs(f => ({ ...f, [i]: !f[i] }));

  // ── Guest Cart helpers ─────────────────────────────────────────────────────
  const saveGuest = (c) => { try { localStorage.setItem('annapurna_guest_cart', JSON.stringify(c)); } catch(_) {} };

  const handleAddToCart = (dish) => {
    setGuestCart(prev => {
      const exists = prev.find(i => i.name === dish.name);
      const next = exists
        ? prev.map(i => i.name === dish.name ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { name: dish.name, price: dish.price, img: dish.img, qty: 1 }];
      saveGuest(next);
      return next;
    });
    setCartOpen(true);
    showToast(dish.name);
  };

  const updateGuestQty = (name, delta) => {
    setGuestCart(prev => {
      const next = prev.map(i => i.name === name ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
      saveGuest(next);
      if (!next.length) setCartOpen(false);
      return next;
    });
  };

  const removeGuestItem = (name) => {
    setGuestCart(prev => {
      const next = prev.filter(i => i.name !== name);
      saveGuest(next);
      if (!next.length) setCartOpen(false);
      return next;
    });
  };

  const handleGuestCheckout = () => {
    saveGuest(guestCart);         // already saved but ensure freshness
    navigate('/login');           // Login → /menu → MenuPage restores cart
  };

  const totalGuestItems = guestCart.reduce((s, i) => s + i.qty, 0);
  const totalGuestPrice = guestCart.reduce((s, i) => s + (parseInt(i.price.replace(/[₹,]/g, '')) || 0) * i.qty, 0);

  // Reset autoplay on manual navigation
  const resetAuto = (idx) => {
    clearInterval(autoRef.current);
    goTo(idx);
    autoRef.current = setInterval(() => setTestiIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
  };

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => scrollTo('home')}>
            <img src={LOGO_URI} alt="Annapurna" className="lp-logo-icon" style={{objectFit:'cover',padding:0}} />
            <div>
              <div className="lp-logo-text">Annapurna</div>
              <div className="lp-logo-sub">Smart Canteen</div>
            </div>
          </div>

          <nav className="lp-nav-links">
            <a onClick={() => scrollTo('home')}>Home</a>
            <a onClick={() => scrollTo('restaurants')}>Restaurants</a>
            <a onClick={() => scrollTo('dishes')}>Menu</a>
            <a onClick={() => scrollTo('why')}>About</a>
          </nav>

          <div className="lp-nav-actions">
            {totalGuestItems > 0 && (
              <button className="lp-nav-cart" onClick={() => setCartOpen(o => !o)}>
                🛒 <span className="lp-nav-cart-badge">{totalGuestItems}</span>
              </button>
            )}
            <button className="lp-nav-login"  onClick={goLogin}>Login</button>
            <button className="lp-nav-signup" onClick={goRegister}>Sign Up</button>
          </div>

          <button className="lp-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lp-mobile-menu${mobileOpen ? ' open' : ''}`}>
        <a onClick={() => scrollTo('home')}>Home</a>
        <a onClick={() => scrollTo('restaurants')}>Restaurants</a>
        <a onClick={() => scrollTo('dishes')}>Menu</a>
        <a onClick={() => scrollTo('why')}>About</a>
        <div className="lp-mob-actions">
          <button className="lp-nav-login"  onClick={goLogin}>Login</button>
          <button className="lp-nav-signup" onClick={goRegister}>Sign Up</button>
        </div>
      </div>

      {/* ── 1. HERO ── */}
      <section className="lp-hero" id="home">
        <div className="lp-hero-bg" />
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />

        <div className="lp-hero-content">
          <div>
            <div className="lp-hero-badge"><span />Now serving 500+ daily orders</div>
            <h1 className="lp-hero-title">Campus Food,<br /><em>Delivered</em><br />In Minutes.</h1>
            <p className="lp-hero-sub">Fresh, hot meals from your favourite canteen stations — ordered in seconds, tracked live, delivered to your doorstep.</p>

            <div className="lp-hero-actions">
              <button className="lp-btn" onClick={goOrder}>🍽️ Order Now</button>
              <button className="lp-ghost" onClick={() => scrollTo('dishes')}>🔍 Explore Menu</button>
            </div>

            <div className="lp-loc">
              <input type="text" placeholder="📍 Enter your block / room number..." />
              <button onClick={goOrder}>Find Food</button>
            </div>

            <div className="lp-hero-stats">
              <div><div className="lp-stat-val">2K+</div><div className="lp-stat-label">Happy Students</div></div>
              <div className="lp-stat-div" />
              <div><div className="lp-stat-val">18 min</div><div className="lp-stat-label">Avg Delivery</div></div>
              <div className="lp-stat-div" />
              <div><div className="lp-stat-val">4.8★</div><div className="lp-stat-label">Avg Rating</div></div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="lp-hero-right">
            <div className="lp-fc lp-fc-main">
              <div className="lp-fc-badge">⚡ Most Ordered Today</div>
              <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&auto=format&fit=crop" alt="Masala Dosa" />
              <div className="lp-fc-rating"><span className="lp-fc-star">★★★★★</span>&nbsp;4.9 (240 reviews)</div>
              <div className="lp-fc-name">Masala Dosa Platter</div>
              <div className="lp-fc-row">
                <span className="lp-fc-price">₹89</span>
                <button className="lp-fc-add" onClick={goOrder}>Add to Cart</button>
              </div>
            </div>
            <div className="lp-fc lp-fc-sm-1 lp-fc-sm" style={{ transform:'rotate(-2deg)' }}>
              <img src="https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&q=80&auto=format&fit=crop" alt="Biryani" />
              <div className="lp-fc-sm-name">Veg Biryani</div>
              <div className="lp-fc-sm-price">₹120</div>
            </div>
            <div className="lp-fc lp-fc-sm-2 lp-fc-sm" style={{ transform:'rotate(2deg)' }}>
              <img src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80&auto=format&fit=crop" alt="Dosa" />
              <div className="lp-fc-sm-name">Paneer Burger</div>
              <div className="lp-fc-sm-price">₹75</div>
            </div>
            <div className="lp-fc lp-fc-eta">
              <div className="lp-fc-eta-icon">🛵</div>
              <div><div className="lp-fc-eta-label">Estimated Delivery</div><div className="lp-fc-eta-val">15–20 min</div></div>
            </div>
          </div>
        </div>

        <div className="lp-scroll"><div className="lp-scroll-line" />Scroll</div>
      </section>

      {/* ── 2. RESTAURANTS ── */}
      <section className="lp-restaurants" id="restaurants">
        <div className="lp-container">
          <div className="lp-sec-head">
            <div>
              <div className="lp-tag lp-reveal">Popular Stations</div>
              <h2 className="lp-title lp-reveal d1">Top <span className="lp-accent">Canteen</span> Stations</h2>
              <p className="lp-sub lp-reveal d2">Handpicked stations with the best ratings and fastest service times.</p>
            </div>
            <button className="lp-ghost lp-reveal d2" style={{ flexShrink:0 }} onClick={goOrder}>View All →</button>
          </div>

          <div className="lp-rest-grid">
            {RESTAURANTS.map((r, i) => (
              <div key={i} className={`lp-rc lp-reveal d${i}`}>
                <div className="lp-rc-img">
                  <img src={r.img} alt={r.name} />
                  <div className="lp-rc-tag">{r.tag}</div>
                  <button className="lp-rc-fav" onClick={() => toggleFav(`r${i}`)}>
                    {favs[`r${i}`] ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="lp-rc-body">
                  <div className="lp-rc-name">{r.name}</div>
                  <div className="lp-rc-cuisine">{r.cuisine}</div>
                  <div className="lp-rc-meta">
                    <div className="lp-rc-rating"><span className="lp-rc-star">★</span> {r.rating} <span style={{ color:'var(--text3)',fontWeight:400 }}>({r.reviews})</span></div>
                    <div className="lp-rc-time">🕒 {r.time} min</div>
                  </div>
                  <div className="lp-rc-footer">
                    <span className="lp-rc-from">From <span className="lp-rc-fromval">{r.from}</span></span>
                    <button className="lp-rc-order" onClick={goOrder}>Order →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ── */}
      <section className="lp-hiw" id="how">
        <div className="lp-hiw-glow" />
        <div className="lp-container">
          <div className="lp-hiw-head">
            <div className="lp-tag lp-reveal" style={{ display:'inline-flex' }}>Simple Process</div>
            <h2 className="lp-title lp-reveal d1">Order in <span className="lp-accent">3 Easy Steps</span></h2>
            <p className="lp-sub lp-reveal d2">From craving to delivery — it's that simple. No app download needed.</p>
          </div>
          <div className="lp-hiw-steps">
            {[
              { num:'01', icon:'🍽️', title:'Choose Your Food',  desc:'Browse our live menu updated daily. Filter by category, dietary needs, or your favourite station.' },
              null,
              { num:'02', icon:'🛒', title:'Add to Cart',       desc:'Build your perfect meal. Pay securely via UPI or choose cash on delivery — your call.' },
              null,
              { num:'03', icon:'🛵', title:'Get Delivered',     desc:'Track your order live. A canteen runner delivers piping hot food right to your location.' },
            ].map((step, i) =>
              step === null
                ? <div key={i} className="lp-hiw-arrow lp-reveal">→</div>
                : (
                  <div key={i} className={`lp-hiw-step lp-reveal d${Math.floor(i/2)}`}>
                    <div className="lp-hiw-num">{step.num}</div>
                    <div className="lp-hiw-icon">{step.icon}</div>
                    <h3 className="lp-hiw-title">{step.title}</h3>
                    <p className="lp-hiw-desc">{step.desc}</p>
                  </div>
                )
            )}
          </div>
        </div>
      </section>

      {/* ── 4. POPULAR DISHES ── */}
      <section className="lp-dishes" id="dishes">
        <div className="lp-container">
          <div className="lp-sec-head">
            <div>
              <div className="lp-tag lp-reveal">Annapurna Menu</div>
              <h2 className="lp-title lp-reveal d1">Our <span className="lp-accent">Menu</span></h2>
              <p className="lp-sub lp-reveal d2">Authentic street food & snacks — freshly made every day.</p>
            </div>
            <div className="lp-filter lp-reveal d2">
              {['all','snacks','chaat','drinks'].map(cat => (
                <button
                  key={cat}
                  className={`lp-filter-btn${dishFilter === cat ? ' active' : ''}`}
                  onClick={() => setDishFilter(cat)}
                >
                  {cat === 'all' ? 'All' : cat === 'snacks' ? '🥪 Snacks' : cat === 'chaat' ? '🌮 Chaat' : '☕ Drinks'}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-dishes-grid">
            {DISHES.filter(d => dishFilter === 'all' || d.cat === dishFilter).map((d, i) => (
              <div key={d.name} className={`lp-dish lp-reveal d${i % 5}`}>
                <div className="lp-dish-img">
                  <img src={d.img} alt={d.name} />
                  <div className="lp-dish-overlay" />
                  <div className={`lp-veg ${d.cat === 'nonveg' ? 'nv' : 'veg'}`}><div className="lp-veg-dot" /></div>
                  <div className="lp-dish-time">⏱ {d.time} min</div>
                </div>
                <div className="lp-dish-body">
                  <div className="lp-dish-rating"><span className="s">{d.stars}</span>&nbsp;{d.rating}</div>
                  <div className="lp-dish-name">{d.name}</div>
                  <div className="lp-dish-desc">{d.desc}</div>
                  <div className="lp-dish-footer">
                    <span className="lp-dish-price">{d.price}</span>
                    <div className="lp-dish-add-wrap">
                      {guestCart.find(i => i.name === d.name) ? (
                        <div className="lp-dish-qty-ctrl">
                          <button className="lp-dish-qty-btn" onClick={() => updateGuestQty(d.name, -1)}>−</button>
                          <span className="lp-dish-qty-num">{guestCart.find(i => i.name === d.name).qty}</span>
                          <button className="lp-dish-qty-btn" onClick={() => updateGuestQty(d.name, +1)}>+</button>
                        </div>
                      ) : (
                        <button className="lp-dish-add" onClick={() => handleAddToCart(d)}>+</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. WHY CHOOSE US ── */}
      <section className="lp-why" id="why">
        <div className="lp-container">
          <div className="lp-why-inner">
            <div className="lp-why-left">
              <div className="lp-tag lp-reveal">Why Annapurna</div>
              <h2 className="lp-title lp-reveal d1">Built for <span className="lp-accent">Campus Life</span></h2>
              <p className="lp-sub lp-reveal d2">Every feature is designed around one thing — getting you fresh, hot food without the hassle of queues or uncertainty.</p>
              <div className="lp-metrics lp-reveal d3">
                <div><div className="lp-metric-val">18<span style={{ fontSize:'1.2rem' }}>min</span></div><div className="lp-metric-label">Avg Delivery Time</div></div>
                <div><div className="lp-metric-val">98<span style={{ fontSize:'1.2rem' }}>%</span></div><div className="lp-metric-label">Order Accuracy</div></div>
                <div><div className="lp-metric-val">4.8<span style={{ fontSize:'1.2rem' }}>★</span></div><div className="lp-metric-label">Student Rating</div></div>
              </div>
            </div>
            <div className="lp-why-grid">
              {WHY_CARDS.map((w, i) => (
                <div key={w.title} className={`lp-wc lp-reveal d${i}`}>
                  <div className="lp-wc-icon">{w.icon}</div>
                  <div className="lp-wc-title">{w.title}</div>
                  <div className="lp-wc-desc">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ── */}
      <section className="lp-testi" id="reviews">
        <div className="lp-container">
          <div className="lp-testi-head">
            <div className="lp-tag lp-reveal" style={{ display:'inline-flex' }}>Student Reviews</div>
            <h2 className="lp-title lp-reveal d1">What Campus <span className="lp-accent">Loves</span> About Us</h2>
            <p className="lp-sub lp-reveal d2">Real reviews from real students. No fluff, just food stories.</p>
          </div>

          <div className="lp-testi-wrap lp-reveal">
            <div className="lp-testi-track" ref={trackRef}>
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name} className={`lp-testi-card${i === testiIdx ? ' active' : ''}`}>
                  <div className="lp-testi-quote">"</div>
                  <p className="lp-testi-text">{t.text}</p>
                  <div className="lp-testi-stars">★★★★★</div>
                  <div className="lp-testi-footer">
                    <img className="lp-testi-avatar" src={t.img} alt={t.name} />
                    <div><div className="lp-testi-name">{t.name}</div><div className="lp-testi-role">{t.role}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-testi-controls lp-reveal d1">
            <button className="lp-testi-btn" onClick={() => resetAuto(testiIdx - 1)}>←</button>
            <div className="lp-testi-dots">
              {TESTIMONIALS.map((_, i) => (
                <div key={i} className={`lp-testi-dot${i === testiIdx ? ' active' : ''}`} onClick={() => resetAuto(i)} />
              ))}
            </div>
            <button className="lp-testi-btn" onClick={() => resetAuto(testiIdx + 1)}>→</button>
          </div>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-inner lp-reveal">
            <div className="lp-cta-glow1" /><div className="lp-cta-glow2" />
            <div className="lp-tag" style={{ display:'inline-flex', marginBottom:20 }}>Limited Time</div>
            <h2 className="lp-cta-title">Your First Order<br /><span className="lp-accent">10% Off.</span> Start Now.</h2>
            <p className="lp-cta-sub">Join 2,000+ students who skip the queue every day.<br />No app needed — works right in your browser.</p>
            <div className="lp-cta-actions">
              <button className="lp-btn" style={{ fontSize:'1rem', padding:'16px 36px' }} onClick={goRegister}>🍽️ Get Started — It's Free</button>
              <button className="lp-ghost" style={{ fontSize:'1rem', padding:'16px 36px' }} onClick={goLogin}>Login</button>
            </div>
            <div className="lp-trust">
              <span>✅ No signup fee</span>
              <div className="lp-trust-dot" />
              <span>✅ Cancel anytime</span>
              <div className="lp-trust-dot" />
              <span>✅ Secure UPI payments</span>
              <div className="lp-trust-dot" />
              <span>✅ Live order tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-main">
            <div>
              <div className="lp-flogo">
                <img src={LOGO_URI} alt="Annapurna" className="lp-flogo-icon" style={{objectFit:'cover',padding:0}} />
                <div><div className="lp-flogo-name">Annapurna</div><div className="lp-flogo-sub">Smart Canteen</div></div>
              </div>
              <p className="lp-fdesc">Serving hot, fresh campus food since 2022. Built with love for students who deserve better than cold cafeteria meals.</p>
              <div className="lp-socials">
                <a className="lp-social" href="#" aria-label="Instagram">📸</a>
                <a className="lp-social" href="#" aria-label="Twitter">🐦</a>
                <a className="lp-social" href="#" aria-label="WhatsApp">💬</a>
                <a className="lp-social" href="#" aria-label="LinkedIn">💼</a>
              </div>
            </div>
            <div>
              <div className="lp-fcol-title">Quick Links</div>
              <ul className="lp-flinks">
                <li><a onClick={() => scrollTo('home')}>Home</a></li>
                <li><a onClick={() => scrollTo('restaurants')}>Our Stations</a></li>
                <li><a onClick={() => scrollTo('dishes')}>Today's Menu</a></li>
                <li><a onClick={() => scrollTo('how')}>How It Works</a></li>
                <li><a onClick={() => scrollTo('why')}>About Us</a></li>
                <li><a onClick={() => scrollTo('reviews')}>Reviews</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-fcol-title">Account</div>
              <ul className="lp-flinks">
                <li><a onClick={goLogin}>Login</a></li>
                <li><a onClick={goRegister}>Sign Up</a></li>
                <li><a onClick={goMenu}>Browse Menu</a></li>
                <li><a onClick={() => navigate('/orders')}>My Orders</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-fcol-title">Contact Us</div>
              <div className="lp-fcontact">
                <div className="lp-fcontact-item"><div className="lp-fcontact-icon">📍</div><span>Main Campus, Block C,<br />Canteen Building</span></div>
                <div className="lp-fcontact-item"><div className="lp-fcontact-icon">📞</div><span>+91 98765 43210</span></div>
                <div className="lp-fcontact-item"><div className="lp-fcontact-icon">✉️</div><span>hello@annapurna.in</span></div>
                <div className="lp-fcontact-item"><div className="lp-fcontact-icon">🕒</div><span>7:00 AM – 12:00 AM · 7 days</span></div>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div className="lp-fcopy">© 2025 <span>Annapurna Smart Canteen</span>. Made with ❤️ for campus life.</div>
            <div className="lp-fbottom-links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a></div>
          </div>
        </div>
      </footer>

      {/* Cart Toast */}
      <div className={`lp-toast${toast ? ' show' : ''}`}>
        <div className="lp-toast-icon">✓</div>
        <span>{toast} added to cart!</span>
      </div>

      {/* ── GUEST CART DRAWER ─────────────────────────────────────────── */}
      {cartOpen && (
        <div className="lp-cart-overlay" onClick={() => setCartOpen(false)} />
      )}
      <div className={`lp-cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="lp-cart-header">
          <div className="lp-cart-title">🛒 Your Cart <span className="lp-cart-count">{totalGuestItems}</span></div>
          <button className="lp-cart-close" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        {guestCart.length === 0 ? (
          <div className="lp-cart-empty">
            <div style={{ fontSize:'2.5rem' }}>🍽️</div>
            <div style={{ fontWeight:700, color:'var(--text2)', fontSize:'1rem' }}>Your cart is empty</div>
            <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Add some delicious items above!</div>
          </div>
        ) : (
          <>
            <div className="lp-cart-items">
              {guestCart.map(item => (
                <div key={item.name} className="lp-ci-row">
                  <img className="lp-ci-img" src={item.img} alt={item.name} />
                  <div className="lp-ci-info">
                    <div className="lp-ci-name">{item.name}</div>
                    <div className="lp-ci-price">{item.price}</div>
                  </div>
                  <div className="lp-ci-qty">
                    <button className="lp-ci-qbtn" onClick={() => updateGuestQty(item.name, -1)}>{item.qty === 1 ? '🗑' : '−'}</button>
                    <span className="lp-ci-qnum">{item.qty}</span>
                    <button className="lp-ci-qbtn" onClick={() => updateGuestQty(item.name, +1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-cart-footer">
              <div className="lp-cart-total">
                <span>Total</span>
                <span>₹{totalGuestPrice}</span>
              </div>
              <div className="lp-cart-login-note">Login to place your order — cart saved!</div>
              <button className="lp-cart-checkout" onClick={handleGuestCheckout}>
                Login &amp; Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}