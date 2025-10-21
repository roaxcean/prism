<img width="2800" height="400" alt="rx_prism" src="https://github.com/user-attachments/assets/33b436d3-6bae-441e-aa43-f8e0cb6ff31b" />

> *P*robably *R*epairs *I*nconsistent *S*e*M*i-transparency

Prism is a fork *(or rather a spiritual fork)* of the original [`Transparent-Pixel-Fix` project by Corecii](https://github.com/Corecii/Transparent-Pixel-Fix), it's an image processing utility designed to help you remove dark outlines on resized images that feature transparent edges.

Think of Prism as a literal prism for your pixels, analyses the colour data from neighbouring pixels, and conveys it further, eliminating the "halo" effect where possible.
> In most cases Prism removes most, if not all, of the black pixels, but in some cases it might fail and "halo" effects might be visible to some extent.

---

<img width="2800" height="250" alt="rx_run" src="https://github.com/user-attachments/assets/315faf68-0875-43d5-a586-375b8bc7ea7a" />

Install all dependencies and compile it via...
```bash
npm i
```
```bash
tsc
```

...and bring up the help menu by running:
```bash
node src/prism.js -h
```

---

<img width="4000" height="1000" alt="rx_fork" src="https://github.com/user-attachments/assets/61b48902-3e7e-4c51-bc18-e765e09d0db1" />
