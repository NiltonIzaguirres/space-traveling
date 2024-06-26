import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDom from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { ExitPreview } from '../../components/ExitPreview';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: {
    uid: string;
    data: {
      title: string;
    }
  }
  prevPost: {
    uid: string;
    data: {
      title: string;
    }
  };
}

export default function Post({ post, preview, nextPost, prevPost }: PostProps) {
  const router = useRouter();

  if(router.isFallback){
    return <h1>Carregando...</h1>
  }

  const amountWords = post.data.content.reduce((acc, data)=>{
    const bodyWords = PrismicDom.RichText.asText(data.body).split(' ').length;
    const headingWords = data.heading.split(' ').length;
    const total = bodyWords + headingWords;
    return total + acc;
  }, 0)

  const readingTime = Math.ceil(amountWords / 200);

  const formattedDate = format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
  )

  useEffect(() => {
    let script = document.createElement("script");
    let anchor = document.getElementById("inject-comments-for-uterances");
    script.setAttribute("src", "https://utteranc.es/client.js");
    script.setAttribute("crossorigin","anonymous");
    script.async = true;
    script.setAttribute("repo", "NiltonIzaguirres/space-traveling");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute( "theme", "github-dark");
    anchor.appendChild(script);
  }, [])

  return (
    <>
      <Head>
        <title>Post | Spacetraveling</title>
      </Head>

      {post.data.banner && (
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt='banner' />
        </div>
      )}

      <main className={commonStyles.container} >
        <article className={styles.post} >
          <h1>{post.data.title}</h1>
          <div className={styles.postInfos}>
            <span>
              <FiCalendar size='20' color='BBBBBB' />
              {formattedDate}
            </span>
            <span>
              <FiUser size='20' color='BBBBBB' />
              {post.data.author}
            </span>
            <span>
              <FiClock size='20' color='BBBBBB' />
              { readingTime } min
            </span>
          </div>
          {
            post.data.content.map(({heading, body}) => (
              <section key={heading} >
                <h2>{heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{ __html: PrismicDom.RichText.asHtml(body) }}
                />
              </section>
            ))
          }
        </article> 
      </main>

      <footer className={`${commonStyles.container} ${styles.footer}`} >
        <div className={styles.divider}></div>

        <section className={styles.navigation}>
          {prevPost && (
            <div>
              <h3>{prevPost.data.title}</h3>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {nextPost && (
            <div>
              <h3>{nextPost.data.title}</h3>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          )}
        </section>

        <div id="inject-comments-for-uterances"></div>
        
        {preview && <ExitPreview />}
      </footer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'post')
  );
  
  return {
    paths: [
      { params: { slug: posts.results[0].uid }},
      { params: { slug: posts.results[1].uid }}
    ],
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = (await prismic.query(
    Prismic.predicates.at('document.type', 'post'), {
      pageSize : 1 ,
      after : `${response.id}`,
      orderings: '[document.first_publication_date]'
    }
  )).results[0]

  const nextPost = (await prismic.query(
    Prismic.predicates.at('document.type', 'post'), {
      pageSize : 1 ,
      after : `${response.id}`,
      orderings: '[document.first_publication_date desc]'
    }
  )).results[0]

  console.log(nextPost);
  console.log(prevPost);

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    }
  }

  return {
    props: {
      post,
      preview,
      prevPost: prevPost || null,
      nextPost: nextPost || null,
    },
    revalidate: 60 * 30, // 30 Minutes
  }
};
