import { DeepChat } from 'deep-chat-react';
import XStream from './utils/xStream';
import { useEffect, useRef } from 'react';
function App() {
  const conversationIdRef = useRef<string | undefined>(undefined);
  const search = new URLSearchParams(window.location.search);
  const code = search.get('code');
  const token = search.get('token');

  useEffect(() => {
    if(token){
      localStorage.setItem('token', token);
    }
    fetch('/api/weight/invite/generate-token', {
      body: JSON.stringify({
        inviteCode: code,
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response) => {
      if (response.ok) {
        const res = await response.json();
        const { data } = res;
        localStorage.setItem('token', data || '');
      } else {
        localStorage.removeItem('token');
      }
    });
  }, [code]);
  return (
    <>
      <DeepChat
        // className="w-[375px] h-[667px]"
        auxiliaryStyle="
    ::-webkit-scrollbar {
     display: none;
    }
    ::-webkit-scrollbar-thumb {
     display: none;
    }"
        style={{
          width: '100vw',
          height: '90vh',
          border: 'unset',
        }}
        messageStyles={{
          default: {
            shared: {
              bubble: {
                maxWidth: '75%',
                borderRadius: '1em',
                padding: '.42em .7em',
                fontSize: '15px',
              },
            },
            user: { bubble: { backgroundColor: '#00c82a' } },
          },
          // loading: { message: { styles: { bubble: { padding: '0.6em 0.75em 0.6em 1.3em' } } } },
        }}
        submitButtonStyles={{
          submit: {
            container: {
              default: {
                width: '0.95em',
                height: '0.95em',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
                borderRadius: '25px',
                padding: '0.3em',
                backgroundColor: '#00c82a',
              },
            },
            svg: {
              content:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 115.4 122.88"><path d="M24.94,67.88A14.66,14.66,0,0,1,4.38,47L47.83,4.21a14.66,14.66,0,0,1,20.56,0L111,46.15A14.66,14.66,0,0,1,90.46,67.06l-18-17.69-.29,59.17c-.1,19.28-29.42,19-29.33-.25L43.14,50,24.94,67.88Z"/></svg>',
              styles: {
                default: {
                  filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7500%) hue-rotate(315deg) brightness(99%) contrast(102%)',
                  transform: 'scale(0.95)',
                },
              },
            },
          },
          loading: {
            container: {
              default: {
                display: 'none',
              },
            },
          },
        }}
        textInput={{
          styles: {
            container: {
              boxShadow: 'none',
              borderRadius: '1em',
              border: '1px solid rgba(0,0,0,0.2)',
            },
            text: {
              padding: '0.4em 0.8em',
              paddingRight: '2.5em',
            },
          },
        }}
        // images={true}
        // camera={{ button: { position: 'dropup-menu' } }}
        dropupStyles={{
          button: {
            styles: {
              container: {
                default: {
                  width: '1.6em',
                  height: '1.6em',
                  borderRadius: '25px',
                  backgroundColor: '#8282821a',
                },
              },
              svg: {
                styles: {
                  default: {
                    width: '1em',
                    marginLeft: '0.06em',
                    marginTop: '0.3em',
                    filter: 'brightness(0) saturate(100%) invert(56%) sepia(0%) saturate(2755%) hue-rotate(104deg) brightness(96%) contrast(93%)',
                  },
                },
                content:
                  '<?xml version="1.0" encoding="utf-8"?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3,11h8V3a1,1,0,0,1,2,0v8h8a1,1,0,0,1,0,2H13v8a1,1,0,0,1-2,0V13H3a1,1,0,0,1,0-2Z"/></svg>',
              },
            },
          },
        }}
        attachmentContainerStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '5px 5px 0 0',
          border: '1px solid rgba(0,0,0,0.2)',
          top: '-2.6em',
          height: '4em',
        }}
        history={
          [
            // { text: 'Hey, how are you?', role: 'user' },
            // { text: 'I am doing great, thanks.', role: 'ai' },
            // { text: 'What is the meaning of life?', role: 'user' },
            // { text: 'Seeking fulfillment and personal growth.', role: 'ai' },
          ]
        }
        // demo={true}
        connect={{
          stream: true,
          handler: (body, signals) => {
            if(!localStorage.getItem('token')) {
              signals.onResponse({
                error: 'Please refresh the page and try again',
              })
              return;
            }
            fetch('/api/agent/demoMessages', {
              body: JSON.stringify({
                query: body.messages[0].text,
                conversationId: conversationIdRef.current,
              }),
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              },
            }).then(async (res) => {
              if (res.ok === false) {
                signals.onResponse({
                  error: 'Error connecting to the server',
                });
                return;
              }
              signals.onOpen(); // stops the loading bubble
              for await (const chunk of XStream<{ data: string }>({
                readableStream: res.body!,
              })) {
                const json = JSON.parse(chunk.data);
                if (json.event === 'message_end') {
                  signals.onClose(); // The stop button will be changed back to submit button
                  return;
                }
                if (json.answer) {
                  if (json.event === 'message') {
                    conversationIdRef.current = json.conversation_id;
                    signals.onResponse({ text: json.answer });
                  }
                }
              }
            });
          },
        }}
      ></DeepChat>
    </>
  );
}

export default App;
