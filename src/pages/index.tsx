import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser  } from "react-icons/fi";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';


import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import { useState } from 'react';
import { ExitPreview } from '../components/ExitPreview';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleLoadPosts() {
    const data: PostPagination = await fetch(postsPagination.next_page)
      .then(response => response.json());

    const results = data.results.map((post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }
    }));

    setPosts([...posts, ...results]);
    setNextPage(data.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>
      
      <main className={`${commonStyles.container} ${styles.container}`} >

        <ul className={styles.posts}>
          {posts.map(post => (
            <li key={post.uid} className={styles.post}>
              <Link href={`/post/${post.uid}`} >
                <a>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <span>
                      <FiCalendar size='20' color='BBBBBB' />
                      {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyyy',
                          { locale: ptBR }
                      )}
                    </span>
                    <span>
                      <FiUser size='20' color='BBBBBB' />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {nextPage && <button
          className={styles.loadPosts}
          type="button"
          onClick={handleLoadPosts}
        >
          Carregar mais posts
        </button>}

        {preview && <ExitPreview />}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      ref: previewData?.ref ?? null,
    }
  );

  const results = postsResponse.results.map((post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  }))

  const postsPagination = {
    next_page: postsResponse.next_page,
    results
  }

  return {
    props: {
      postsPagination,
      preview
    },
    revalidate: 60 * 60 * 24 // 24 hours
  }
};
