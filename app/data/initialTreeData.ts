import { TreeNode } from "../types/TreeNode";

export const initialTreeData: TreeNode[] = [
  {
    id: "sudarshan",
    name: "Sudarshan",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "sudarshan-avinash", name: "Avinash", value: 0.03125, children: [] },
      { id: "sudarshan-nanda", name: "Nanda", value: 0.03125, children: [] },
      { id: "sudarshan-bharti", name: "Bharti", value: 0.03125, children: [] },
      { id: "sudarshan-manju", name: "Manju", value: 0.03125, children: [] },
    ],
  },
  {
    id: "ishwar",
    name: "Ishwar",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "ishwar-dinesh", name: "Dinesh", value: 0.041666667, children: [] },
      { id: "ishwar-kishore", name: "Kishore", value: 0.041666667, children: [] },
      { id: "ishwar-vijay", name: "Vijay", value: 0.041666667, children: [] },
    ],
  },
  {
    id: "vigyan",
    name: "Vigyan",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "vigyan-vikas", name: "Vikas", value: 0.03125, children: [] },
      { id: "vigyan-pragati", name: "Pragati", value: 0.03125, children: [] },
      { id: "vigyan-subhash", name: "Subhash", value: 0.03125, children: [] },
      { id: "vigyan-chandra", name: "Chandra", value: 0.03125, children: [] },
    ],
  },
  {
    id: "parmesh",
    name: "Parmesh",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "parmesh-pradeep", name: "Pradeep", value: 0.013888889, children: [] },
      { id: "parmesh-sanjay", name: "Sanjay", value: 0.013888889, children: [] },
      { id: "parmesh-abhijeet", name: "Abhijeet", value: 0.013888889, children: [] },
      { id: "parmesh-ravi", name: "Ravi", value: 0.013888889, children: [] },
      { id: "parmesh-mamta", name: "Mamta", value: 0.013888889, children: [] },
      { id: "parmesh-kiran", name: "Kiran", value: 0.013888889, children: [] },
      { id: "parmesh-anita", name: "Anita", value: 0.013888889, children: [] },
      { id: "parmesh-sunita", name: "Sunita", value: 0.013888889, children: [] },
      { id: "parmesh-geeta", name: "Geeta", value: 0.013888889, children: [] },
    ],
  },
  {
    id: "pratap",
    name: "Pratap",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "pratap-shailendra", name: "Shailendra", value: 0.03125, children: [] },
      { id: "pratap-smita", name: "Smita", value: 0.03125, children: [] },
      { id: "pratap-kavita", name: "Kavita", value: 0.03125, children: [] },
      { id: "pratap-nishith", name: "Nishith", value: 0.03125, children: [] },
    ],
  },
  {
    id: "jagdish",
    name: "Jagdish",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "jagdish-soutmit", name: "Soutmit", value: 0.0625, children: [] },
      { id: "jagdish-satyen", name: "Satyen", value: 0.0625, children: [] },
    ],
  },
  {
    id: "shripal",
    name: "Shripal",
    value: 0.125,
    isTopLevel: true,
    children: [
      { id: "shripal-kiran", name: "Kiran", value: 0.041666667, children: [] },
      { id: "shripal-charu", name: "Charu", value: 0.041666667, children: [] },
      { id: "shripal-ajay", name: "Ajay", value: 0.041666667, children: [] },
    ],
  },    
  {
    id: "aaji",
    name: "Aaji",
    value: 0.125,
    isTopLevel: true,
    children: [
      {
        id: "aaji-sudarshan",
        name: "Sudarshan",
        value: 0.015625,
        children: [
          { id: "aaji-sudarshan-avinash", name: "Avinash", value: 0.00390625, children: [] },
          { id: "aaji-sudarshan-nanda", name: "Nanda", value: 0.00390625, children: [] },
          { id: "aaji-sudarshan-bharti", name: "Bharti", value: 0.00390625, children: [] },
          { id: "aaji-sudarshan-manju", name: "Manju", value: 0.00390625, children: [] },
        ],
      },
      {
        id: "aaji-shripal",
        name: "Shripal",
        value: 0.015625,
        children: [
          { id: "aaji-shripal-kiran", name: "Kiran", value: 0.005208333, children: [] },
          { id: "aaji-shripal-charu", name: "Charu", value: 0.005208333, children: [] },
          { id: "aaji-shripal-ajay", name: "Ajay", value: 0.005208333, children: [] },
        ],
      },
      {
        id: "aaji-ishwar",
        name: "Ishwar",
        value: 0.015625,
        children: [
          { id: "aaji-ishwar-dinesh", name: "Dinesh", value: 0.005208333, children: [] },
          { id: "aaji-ishwar-kishore", name: "Kishore", value: 0.005208333, children: [] },
          { id: "aaji-ishwar-vijay", name: "Vijay", value: 0.005208333, children: [] },
        ],
      },
      {
        id: "aaji-vigyan",
        name: "Vigyanchand",
        value: 0.015625,
        children: [
          { id: "aaji-vigyan-vikas", name: "Vikas", value: 0.00390625, children: [] },
          { id: "aaji-vigyan-pragati", name: "Pragati", value: 0.00390625, children: [] },
          { id: "aaji-vigyan-subhash", name: "Subhash", value: 0.00390625, children: [] },
          { id: "aaji-vigyan-chandra", name: "Chandra", value: 0.00390625, children: [] },
        ],
      },
      {
        id: "aaji-parmesh",
        name: "Parmeshwar",
        value: 0.015625,
        children: [
          { id: "aaji-parmesh-pradeep", name: "Pradeep", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-sanjay", name: "Sanjay", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-abhijeet", name: "Abhijeet", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-ravi", name: "Ravi", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-mamta", name: "Mamta", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-kiran2", name: "Kiran", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-anita", name: "Anita", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-sunita", name: "Sunita", value: 0.001736111, children: [] },
          { id: "aaji-parmesh-geeta", name: "Geeta", value: 0.001736111, children: [] },
        ],
      },
      {
        id: "aaji-pratap",
        name: "Pratapchand",
        value: 0.015625,
        children: [
          { id: "aaji-pratap-shailendra", name: "Shailendra", value: 0.00390625, children: [] },
          { id: "aaji-pratap-smita", name: "Smita", value: 0.00390625, children: [] },
          { id: "aaji-pratap-kavita", name: "Kavita", value: 0.00390625, children: [] },
          { id: "aaji-pratap-nishith", name: "Nishith", value: 0.00390625, children: [] },
        ],
      },
      {
        id: "aaji-jagdish",
        name: "Jagdish",
        value: 0.015625,
        children: [
          { id: "aaji-jagdish-soutmit", name: "Soutmit", value: 0.0078125, children: [] },
          { id: "aaji-jagdish-satyen", name: "Satyen", value: 0.0078125, children: [] },
        ],
      },
      {
        id: "aaji-laxmibai",
        name: "Laxmibai",
        value: 0.015625,
        children: [
          { id: "aaji-laxmibai-arun", name: "Arun", value: 0.00390625, children: [] },
          { id: "aaji-laxmibai-snehlata", name: "Snehlata", value: 0.00390625, children: [] },
          { id: "aaji-laxmibai-manto", name: "Manto", value: 0.00390625, children: [] },
          { id: "aaji-laxmibai-gautam", name: "Gautam", value: 0.00390625, children: [] },
        ],
      },
    ],
  },
];