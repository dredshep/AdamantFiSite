import * as Form from "@radix-ui/react-form";
import { ComboboxForm } from "./formExample";

// export default function SwapForm() {
//   return (
//     <div>
//       <Form.Root className="flex flex-col gap-4">
//         <Form.Field name="from" defaultValue="SCRT">
//           <div className="flex flex-col gap-2">
//             <Form.Label className="uppercase font-medium">You pay</Form.Label>
//             <Form.Message className="text-red-500" match="valueMissing">
//               Please enter an amount
//             </Form.Message>
//             <Form.Message className="text-red-500" match="patternMismatch">
//               Please enter a valid amount
//             </Form.Message>
//             <Form.Control asChild className="flex gap-2">
//               <input type="number" min="0" step="0.01" className="w-24" />
//               {/* <select className="w-24">
//                 <option>SCRT</option>
//                 <option>ADMT</option>
//               </select> */}
//             </Form.Control>
//           </div>
//         </Form.Field>
//         <Form.Field name="to" defaultValue="ADMT">
//           <div className="flex flex-col gap-2">
//             <Form.Label className="uppercase font-medium">You get</Form.Label>
//             <Form.Message className="text-red-500" match="valueMissing">
//               Please enter an amount
//             </Form.Message>
//             <Form.Message className="text-red-500" match="patternMismatch">
//               Please enter a valid amount
//             </Form.Message>
//             <Form.Control asChild className="flex gap-2">
//               <input type="number" min="0" step="0.01" className="w-24" />
//               {/* <select className="w-24">
//                 <option>SCRT</option>
//                 <option>ADMT</option>
//               </select> */}
//             </Form.Control>
//           </div>
//         </Form.Field>
//         <Form.Submit className="bg-black text-white py-2 rounded-lg">
//           Swap
//         </Form.Submit>
//       </Form.Root>
//     </div>
//   );
// }
// import React from "react";
// import * as Form from "@radix-ui/react-form";
// // import './styles.css';

// const FormDemo = () => (
//   <Form.Root className="flex flex-col gap-4">
//     <Form.Field name="from" defaultValue="SCRT">
//       <div
//         style={{
//           display: "flex",
//           alignItems: "baseline",
//           justifyContent: "space-between",
//         }}
//       >
//         <Form.Label className="uppercase font-medium">Email</Form.Label>
//         <Form.Message className="text-red-500" match="valueMissing">
//           Please enter an amount
//         </Form.Message>
//         <Form.Message className="text-red-500" match="patternMismatch">
//           Please enter a valid amount
//         </Form.Message>
//       </div>
//       <Form.Control asChild>
//         <input type="number" min="0" step="0.01" className="w-24" required />
//       </Form.Control>
//     </Form.Field>
//     <Form.Field name="to" defaultValue="ADMT">
//       <div
//         style={{
//           display: "flex",
//           alignItems: "baseline",
//           justifyContent: "space-between",
//         }}
//       >
//         <Form.Label className="uppercase font-medium">Question</Form.Label>
//         <Form.Message className="FormMessage" match="valueMissing">
//           Please enter a question
//         </Form.Message>
//       </div>
//       <Form.Control asChild>
//         <textarea className="Textarea" required />
//       </Form.Control>
//     </Form.Field>
//     <Form.Submit asChild>
//       <button className="Button" style={{ marginTop: 10 }}>
//         Post question
//       </button>
//     </Form.Submit>
//   </Form.Root>
// );

// export default FormDemo;

export default ComboboxForm;
