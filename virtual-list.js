function virtualList({
  container,
  containerHeight = 500,
  itemsCount,
  render,
  throttleMs = 0,
}) {
  container.style.overflow = "auto";
  container.style.height = containerHeight + "px";
  container.innerHTML = "<div></div>";
  const subcont = container.firstChild;

  subcont.innerHTML = "<div></div><div></div>"; // head + tail
  const head = subcont.firstChild;
  const tail = subcont.lastChild;

  let force; // use flag instead of arg to ease passing handler

  let prevTop = 0;
  let prevI = 0;

  function renderVisible() {
    const vh = container.clientHeight;
    const origin = container.offsetTop;

    const top = container.scrollTop;
    let i = prevI;

    if (force || Math.abs(top - prevTop) > vh) {
      // rebuild from scratch

      force = false;

      if (top === 0) prevTop = prevI = 0;

      const pxPerItem = (subcont.scrollHeight - prevTop) / (itemsCount - prevI);
      const deltaI = (top - prevTop) / pxPerItem;

      i = prevI + deltaI || 0; // if NaN
      i = Math.floor(i);
      i = Math.max(0, Math.min(itemsCount - 1, i));

      if (top !== prevTop || top === 0) head.style.height = top + "px";

      while (head.nextSibling !== tail) {
        head.nextSibling.remove();
      }

      let k = 0;

      while (true) {
        if (i + k >= itemsCount) break;

        const wrap = document.createElement("div");
        wrap.append(render(i + k));
        tail.before(wrap);

        if (tail.offsetTop - origin > container.scrollTop + vh) break;

        k++;
      }
    } else if (top < prevTop) {
      // scroll up, prepend ↑↑↑↑↑↑↑

      // pop
      while (tail.previousSibling !== head) {
        const wrap = tail.previousSibling;

        if (wrap.offsetTop - origin > top + vh) {
          wrap.remove();
        } else break;
      }

      // unshift
      while (i > 0) {
        const wrap = head.nextSibling;

        if (wrap.offsetTop - origin > top) {
          const newWrap = document.createElement("div");
          newWrap.append(render(--i));
          head.after(newWrap);
          head.style.height =
            head.scrollHeight - (wrap.offsetTop - newWrap.offsetTop) + "px";
        } else break;
      }
    } else if (top > prevTop || prevTop === 0) {
      // scroll down, append ↓↓↓↓↓↓↓

      // shift
      while (head.nextSibling !== tail) {
        const wrap = head.nextSibling;
        const nextWrap = wrap.nextSibling;

        if (nextWrap && nextWrap.offsetTop - origin <= top) {
          head.style.height =
            head.scrollHeight + (nextWrap.offsetTop - wrap.offsetTop) + "px";
          wrap.remove();
          i++;
        } else break;
      }

      // push
      while (i + subcont.children.length - 2 < itemsCount) {
        if (tail.offsetTop - origin < container.scrollTop + vh) {
          const newWrap = document.createElement("div");
          newWrap.append(render(i + subcont.children.length - 2));
          tail.before(newWrap);
        } else break;
      }
    }

    // adjust scrollbar
    const pxSoFar = tail.offsetTop - origin;
    const itemsLeft = itemsCount - (i + subcont.children.length - 2);
    const pxPerItem = pxSoFar / (itemsCount - itemsLeft);
    const pxAhead = itemsLeft * pxPerItem;
    subcont.style.height = pxSoFar + pxAhead + "px";

    prevTop = top;
    prevI = i;
  }

  const handler = throttleMs
    ? throttled(renderVisible, throttleMs)
    : renderVisible;

  handler();

  container.addEventListener("scroll", handler);
  const resizeObserver = new ResizeObserver(handler);
  resizeObserver.observe(container);

  return {
    update(newItemsCount) {
      itemsCount = newItemsCount;
      force = true;
      handler();
    },
    dispose() {
      container.removeEventListener("scroll", handler);
      resizeObserver.unobserve(container);
    },
  };
}

function throttled(fn, ms) {
  let muted;
  return function () {
    if (muted) return;
    muted = true;
    setTimeout(() => (muted = false), ms);
    fn();
  };
}
