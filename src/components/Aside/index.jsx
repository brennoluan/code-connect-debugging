import Image from "next/image";
import styles from "./aside.module.css";

import logo from "./logo.png";
import Link from "next/link";
import { LastUpdateTime } from "./LastUpdateTime";

export const Aside = () => {
  return (
    <aside className={styles.aside}>
      <Link href="/">
        <Image src={logo} alt="Logo da Code Connect" />
      </Link>
      <div className={styles.lastUpdate}>
        <small>Última atualização:</small>
        <LastUpdateTime />
      </div>
    </aside>
  );
};
