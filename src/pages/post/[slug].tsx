import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDom from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';

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
}

export default function Post({ post }: PostProps) {
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

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(context.params.slug), {});

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
      post
    },
    revalidate: 60 * 30, // 30 Minutes
  }
};
